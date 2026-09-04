import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { uploadFileToCloudinary, deleteFileFromCloudinary, CLOUDINARY_FOLDERS } from '../services/cloudinary.service';
import { mediaQuerySchema } from '../validation/index';
import { AuthenticatedRequest } from '../middlewares/auth';
import path from 'path';

/**
 * Upload single media file to Cloudinary & record in PostgreSQL
 * POST /api/media/upload
 */
export async function uploadMedia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.file;
    const requestedFolder = (req.body.folder || req.query.folder || CLOUDINARY_FOLDERS.MEDIA) as string;

    const isAudio = file.mimetype.startsWith('audio/');
    const isVideo = file.mimetype.startsWith('video/');
    const resourceType = isAudio || isVideo ? 'video' : 'image';

    // Meaningful public ID based on original filename
    const cleanBaseName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const customPublicId = `${Date.now()}_${cleanBaseName}`;

    const uploadRes = await uploadFileToCloudinary(
      file.path,
      requestedFolder,
      resourceType,
      customPublicId
    );

    const mediaRecord = await prisma.media.create({
      data: {
        originalName: file.originalname,
        cloudinaryPublicId: uploadRes.publicId,
        cloudinaryUrl: uploadRes.secureUrl,
        resourceType: uploadRes.resourceType,
        format: uploadRes.format,
        mimeType: file.mimetype,
        fileSize: uploadRes.bytes || file.size,
        duration: uploadRes.duration ? parseFloat(uploadRes.duration.toString()) : null,
        width: uploadRes.width || null,
        height: uploadRes.height || null,
        folder: requestedFolder,
        userId: req.user?.userId || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Media uploaded successfully to Cloudinary',
      data: mediaRecord,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List media records with search & filters
 * GET /api/media
 */
export async function listMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const query = mediaQuerySchema.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    const where: any = {};
    if (query.folder && query.folder !== 'ALL') {
      where.folder = { contains: query.folder, mode: 'insensitive' };
    }
    if (query.resourceType) {
      where.resourceType = query.resourceType;
    }
    if (query.search) {
      where.originalName = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.media.count({ where }),
    ]);

    return res.json({
      success: true,
      data: items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get media by ID
 * GET /api/media/:id
 */
export async function getMediaById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const media = await prisma.media.findUnique({
      where: { id },
    });
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media record not found' });
    }
    return res.json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete media from PostgreSQL and Cloudinary
 * DELETE /api/media/:id
 */
export async function deleteMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media record not found' });
    }

    // Delete asset from Cloudinary
    const resourceType = media.resourceType === 'video' ? 'video' : 'image';
    await deleteFileFromCloudinary(media.cloudinaryPublicId, resourceType);

    // Delete record from database
    await prisma.media.delete({
      where: { id: media.id },
    });

    return res.json({
      success: true,
      message: 'Media asset deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
