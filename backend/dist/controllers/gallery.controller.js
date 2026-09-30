"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGallery = getGallery;
exports.createGalleryItem = createGalleryItem;
exports.deleteGalleryItem = deleteGalleryItem;
exports.updateGalleryItem = updateGalleryItem;
const prisma_1 = require("../config/prisma");
const cloudinary_service_1 = require("../services/cloudinary.service");
async function getGallery(req, res, next) {
    try {
        const { album, type, category } = req.query;
        const where = { deletedAt: null };
        if (album)
            where.album = album;
        if (type)
            where.type = type;
        if (category)
            where.category = category;
        const items = await prisma_1.prisma.galleryItem.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: items });
    }
    catch (error) {
        next(error);
    }
}
async function createGalleryItem(req, res, next) {
    try {
        const file = req.file;
        let mediaUrl = req.body.mediaUrl;
        let publicId = req.body.publicId || req.body.cloudinaryPublicId || null;
        if (file) {
            mediaUrl = file.path && (file.path.startsWith('http://') || file.path.startsWith('https://')) ? file.path : `/uploads/${file.filename}`;
            publicId = file.public_id || (0, cloudinary_service_1.extractPublicIdFromUrl)(mediaUrl);
        }
        if (!publicId && mediaUrl) {
            publicId = (0, cloudinary_service_1.extractPublicIdFromUrl)(mediaUrl);
        }
        const { title, description, type, thumbnail, duration, album, category } = req.body;
        let thumbnailPublicId = req.body.thumbnailPublicId || (thumbnail ? (0, cloudinary_service_1.extractPublicIdFromUrl)(thumbnail) : null);
        const item = await prisma_1.prisma.galleryItem.create({
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
    }
    catch (error) {
        next(error);
    }
}
async function deleteGalleryItem(req, res, next) {
    try {
        const id = req.params.id;
        const item = await prisma_1.prisma.galleryItem.findUnique({ where: { id } });
        if (item) {
            const pid = item.publicId || (0, cloudinary_service_1.extractPublicIdFromUrl)(item.mediaUrl);
            if (pid) {
                const resourceType = item.type === 'VIDEO' ? 'video' : 'image';
                await (0, cloudinary_service_1.deleteFileFromCloudinary)(pid, resourceType);
            }
            if (item.thumbnail) {
                const tPid = item.thumbnailPublicId || (0, cloudinary_service_1.extractPublicIdFromUrl)(item.thumbnail);
                if (tPid) {
                    await (0, cloudinary_service_1.deleteFileFromCloudinary)(tPid, 'image');
                }
            }
        }
        await prisma_1.prisma.galleryItem.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return res.json({ success: true, message: 'Gallery item deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function updateGalleryItem(req, res, next) {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.galleryItem.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Gallery item not found' });
        }
        const file = req.file;
        let mediaUrl = req.body.mediaUrl;
        let publicId = req.body.publicId || req.body.cloudinaryPublicId || null;
        if (file) {
            mediaUrl = file.path && (file.path.startsWith('http://') || file.path.startsWith('https://')) ? file.path : `/uploads/${file.filename}`;
            publicId = file.public_id || (0, cloudinary_service_1.extractPublicIdFromUrl)(mediaUrl);
        }
        if (!publicId && mediaUrl) {
            publicId = (0, cloudinary_service_1.extractPublicIdFromUrl)(mediaUrl);
        }
        if (publicId && existing.publicId && existing.publicId !== publicId) {
            try {
                const resourceType = existing.type === 'VIDEO' ? 'video' : 'image';
                await (0, cloudinary_service_1.deleteFileFromCloudinary)(existing.publicId, resourceType);
            }
            catch (e) {
                console.warn('Old gallery photo cleanup warning:', e);
            }
        }
        const { title, description, type, thumbnail, duration, album, category } = req.body;
        let thumbnailPublicId = req.body.thumbnailPublicId || (thumbnail ? (0, cloudinary_service_1.extractPublicIdFromUrl)(thumbnail) : undefined);
        const updated = await prisma_1.prisma.galleryItem.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(type !== undefined && { type }),
                ...(mediaUrl !== undefined && { mediaUrl }),
                ...(publicId !== undefined && { publicId }),
                ...(thumbnail !== undefined && { thumbnail }),
                ...(thumbnailPublicId !== undefined && { thumbnailPublicId }),
                ...(duration !== undefined && { duration }),
                ...(album !== undefined && { album }),
                ...(category !== undefined && { category }),
            },
        });
        return res.json({ success: true, message: 'Gallery item updated successfully', data: updated });
    }
    catch (error) {
        next(error);
    }
}
