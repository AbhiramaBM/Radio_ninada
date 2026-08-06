"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNews = getNews;
exports.createNews = createNews;
exports.updateNews = updateNews;
exports.deleteNews = deleteNews;
const prisma_1 = require("../config/prisma");
const slug_1 = require("../utils/slug");
const duplicate_1 = require("../utils/duplicate");
const index_1 = require("../validation/index");
async function getNews(req, res, next) {
    try {
        const { search, category, status, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const where = { deletedAt: null };
        if (category)
            where.category = category;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { content: { contains: search } },
            ];
        }
        const [newsItems, total] = await Promise.all([
            prisma_1.prisma.news.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.news.count({ where }),
        ]);
        return res.json({
            success: true,
            data: newsItems,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    }
    catch (error) {
        next(error);
    }
}
async function createNews(req, res, next) {
    try {
        let imageUrl = req.body.imageUrl;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }
        const rawData = {
            ...req.body,
            imageUrl: imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
        };
        const data = index_1.newsSchema.parse(rawData);
        const isDuplicate = await (0, duplicate_1.checkDuplicateNews)(data.title);
        if (isDuplicate) {
            return res.status(400).json({
                success: false,
                message: `Duplicate Warning: News article with headline "${data.title}" already exists.`,
            });
        }
        let slug = (0, slug_1.generateSlug)(data.title);
        const existingSlug = await prisma_1.prisma.news.findUnique({ where: { slug } });
        if (existingSlug) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
        const newsItem = await prisma_1.prisma.news.create({
            data: {
                ...data,
                slug,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
            },
        });
        return res.status(201).json({ success: true, message: 'News article created successfully', data: newsItem });
    }
    catch (error) {
        next(error);
    }
}
async function updateNews(req, res, next) {
    try {
        const id = req.params.id;
        const data = req.body;
        if (data.title) {
            const isDup = await (0, duplicate_1.checkDuplicateNews)(data.title, id);
            if (isDup) {
                return res.status(400).json({
                    success: false,
                    message: `Duplicate Warning: News article with headline "${data.title}" already exists.`,
                });
            }
        }
        const updated = await prisma_1.prisma.news.update({
            where: { id },
            data: {
                ...data,
                ...(data.publishedAt && { publishedAt: new Date(data.publishedAt) }),
            },
        });
        return res.json({ success: true, message: 'News article updated successfully', data: updated });
    }
    catch (error) {
        next(error);
    }
}
async function deleteNews(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.news.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return res.json({ success: true, message: 'News article deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
