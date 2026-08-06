"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBanners = getBanners;
exports.createBanner = createBanner;
exports.deleteBanner = deleteBanner;
const prisma_1 = require("../config/prisma");
async function getBanners(req, res, next) {
    try {
        const { type, status } = req.query;
        const where = {};
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        const banners = await prisma_1.prisma.banner.findMany({
            where,
            orderBy: { priority: 'asc' },
        });
        return res.json({ success: true, data: banners });
    }
    catch (error) {
        next(error);
    }
}
async function createBanner(req, res, next) {
    try {
        const file = req.file;
        let imageUrl = req.body.imageUrl;
        if (file) {
            imageUrl = `/uploads/${file.filename}`;
        }
        const { title, targetUrl, type, priority, expiryDate, status } = req.body;
        const banner = await prisma_1.prisma.banner.create({
            data: {
                title,
                imageUrl: imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
                targetUrl,
                type: type || 'HOMEPAGE',
                priority: priority ? parseInt(priority, 10) : 1,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                status: status || 'ACTIVE',
            },
        });
        return res.status(201).json({ success: true, message: 'Banner added successfully', data: banner });
    }
    catch (error) {
        next(error);
    }
}
async function deleteBanner(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.banner.delete({ where: { id } });
        return res.json({ success: true, message: 'Banner deleted' });
    }
    catch (error) {
        next(error);
    }
}
