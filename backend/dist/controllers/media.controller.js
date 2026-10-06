"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadSignature = getUploadSignature;
exports.recordUploadedMedia = recordUploadedMedia;
exports.uploadMedia = uploadMedia;
exports.listMedia = listMedia;
exports.getMediaById = getMediaById;
exports.deleteMedia = deleteMedia;
const prisma_1 = require("../config/prisma");
const cloudinary_service_1 = require("../services/cloudinary.service");
const index_1 = require("../validation/index");
const cloudinary_1 = require("../config/cloudinary");
const index_2 = require("../config/index");
const path_1 = __importDefault(require("path"));
/**
 * Generate signed upload signature for direct browser -> Cloudinary uploads
 * GET /api/media/signature
 */
async function getUploadSignature(req, res, next) {
    try {
        const folder = req.query.folder || cloudinary_service_1.CLOUDINARY_FOLDERS.MEDIA;
        const timestamp = Math.round(new Date().getTime() / 1000);
        const signature = cloudinary_1.cloudinary.utils.api_sign_request({ timestamp, folder }, index_2.config.cloudinary.apiSecret);
        return res.json({
            success: true,
            data: {
                signature,
                timestamp,
                cloudName: index_2.config.cloudinary.cloudName,
                apiKey: index_2.config.cloudinary.apiKey,
                folder,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Record direct Cloudinary upload into PostgreSQL
 * POST /api/media/record
 */
async function recordUploadedMedia(req, res, next) {
    try {
        const { originalName, cloudinaryPublicId, cloudinaryUrl, resourceType, format, mimeType, fileSize, duration, width, height, folder, } = req.body;
        if (!cloudinaryPublicId || !cloudinaryUrl) {
            return res.status(400).json({ success: false, message: 'Missing cloudinaryPublicId or cloudinaryUrl' });
        }
        const mediaRecord = await prisma_1.prisma.media.create({
            data: {
                originalName: originalName || 'file',
                cloudinaryPublicId,
                cloudinaryUrl,
                resourceType: resourceType || 'image',
                format: format || null,
                mimeType: mimeType || null,
                fileSize: fileSize ? parseInt(fileSize.toString(), 10) : null,
                duration: duration ? parseFloat(duration.toString()) : null,
                width: width ? parseInt(width.toString(), 10) : null,
                height: height ? parseInt(height.toString(), 10) : null,
                folder: folder || cloudinary_service_1.CLOUDINARY_FOLDERS.MEDIA,
                userId: req.user?.userId || null,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'Direct Cloudinary upload recorded successfully',
            data: mediaRecord,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Upload single media file to Cloudinary & record in PostgreSQL
 * POST /api/media/upload
 */
async function uploadMedia(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const file = req.file;
        const requestedFolder = (req.body.folder || req.query.folder || cloudinary_service_1.CLOUDINARY_FOLDERS.MEDIA);
        const isAudio = file.mimetype.startsWith('audio/');
        const isVideo = file.mimetype.startsWith('video/');
        const resourceType = isAudio || isVideo ? 'video' : 'image';
        // Meaningful public ID based on original filename
        const cleanBaseName = path_1.default.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const customPublicId = `${Date.now()}_${cleanBaseName}`;
        const uploadRes = await (0, cloudinary_service_1.uploadFileToCloudinary)(file.path, requestedFolder, resourceType, customPublicId);
        const mediaRecord = await prisma_1.prisma.media.create({
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * List media records with search & filters
 * GET /api/media
 */
async function listMedia(req, res, next) {
    try {
        const query = index_1.mediaQuerySchema.parse(req.query);
        const skip = (query.page - 1) * query.limit;
        const where = {};
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
            prisma_1.prisma.media.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: query.limit,
            }),
            prisma_1.prisma.media.count({ where }),
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get media by ID
 * GET /api/media/:id
 */
async function getMediaById(req, res, next) {
    try {
        const id = req.params.id;
        const media = await prisma_1.prisma.media.findUnique({
            where: { id },
        });
        if (!media) {
            return res.status(404).json({ success: false, message: 'Media record not found' });
        }
        return res.json({ success: true, data: media });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Delete media from PostgreSQL and Cloudinary
 * DELETE /api/media/:id
 */
async function deleteMedia(req, res, next) {
    try {
        const id = req.params.id;
        const media = await prisma_1.prisma.media.findUnique({
            where: { id },
        });
        if (!media) {
            return res.status(404).json({ success: false, message: 'Media record not found' });
        }
        // Delete asset from Cloudinary
        const resourceType = media.resourceType === 'video' ? 'video' : 'image';
        await (0, cloudinary_service_1.deleteFileFromCloudinary)(media.cloudinaryPublicId, resourceType);
        // Delete record from database
        await prisma_1.prisma.media.delete({
            where: { id: media.id },
        });
        return res.json({
            success: true,
            message: 'Media asset deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
}
