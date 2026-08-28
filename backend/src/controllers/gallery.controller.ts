import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { deleteFileFromCloudinary, extractPublicIdFromUrl } from '../services/cloudinary.service';

export async function getGallery(req: Request, res: Response, next: NextFunction) {
  try {
    const { album, type, category } = req.query;
    const where: any = { deletedAt: null };
    if (album) where.album = album as string;
    if (type) where.type = type as string;
    if (category) where.category = category as string;

    const items = await prisma.galleryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
}

export async function createGalleryItem(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    let mediaUrl = req.body.mediaUrl;
    let publicId = req.body.publicId || req.body.cloudinaryPublicId || null;

    if (file) {
      mediaUrl = file.path && (file.path.startsWith('http://') || file.path.startsWith('https://')) ? file.path : `/uploads/${file.filename}`;
      publicId = (file as any).public_id || extractPublicIdFromUrl(mediaUrl);
    }

    if (!publicId && mediaUrl) {
      publicId = extractPublicIdFromUrl(mediaUrl);
    }

    const { title, description, type, thumbnail, duration, album, category } = req.body;
    let thumbnailPublicId = req.body.thumbnailPublicId || (thumbnail ? extractPublicIdFromUrl(thumbnail) : null);

    const item = await prisma.galleryItem.create({
      data: {
        title: title || 'Gallery Item',
        description: description || null,
        type: type || 'PHOTO',
        mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
        publicId,
        thumbnail: thumbnail || null,
        thumbnailPublicId,
        duration: duration || null,
        album: album || 'Behind The Mic',
        category: category || 'BTS Shorts',
      },
    });

    return res.status(201).json({ success: true, message: 'Gallery item uploaded successfully', data: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteGalleryItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const item = await prisma.galleryItem.findUnique({ where: { id } });

    if (item) {
      const pid = item.publicId || extractPublicIdFromUrl(item.mediaUrl);
      if (pid) {
        const resourceType = item.type === 'VIDEO' ? 'video' : 'image';
        await deleteFileFromCloudinary(pid, resourceType);
      }
      if (item.thumbnail) {
        const tPid = item.thumbnailPublicId || extractPublicIdFromUrl(item.thumbnail);
        if (tPid) {
          await deleteFileFromCloudinary(tPid, 'image');
        }
      }
    }

    await prisma.galleryItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (error) {
    next(error);
  }
}

