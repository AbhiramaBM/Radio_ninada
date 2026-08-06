"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGallery = getGallery;
exports.createGalleryItem = createGalleryItem;
exports.deleteGalleryItem = deleteGalleryItem;
const prisma_1 = require("../config/prisma");
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
        if (file) {
            mediaUrl = `/uploads/${file.filename}`;
        }
        const { title, description, type, thumbnail, duration, album, category } = req.body;
        const item = await prisma_1.prisma.galleryItem.create({
            data: {
                title: title || 'Gallery Item',
                description: description || null,
                type: type || 'PHOTO',
                mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
                thumbnail: thumbnail || null,
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
