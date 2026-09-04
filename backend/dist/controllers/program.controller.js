"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrograms = getPrograms;
exports.getProgramBySlug = getProgramBySlug;
exports.createProgram = createProgram;
exports.deleteProgram = deleteProgram;
const prisma_1 = require("../config/prisma");
const slug_1 = require("../utils/slug");
const duplicate_1 = require("../utils/duplicate");
const index_1 = require("../validation/index");
const cloudinary_service_1 = require("../services/cloudinary.service");
async function getPrograms(req, res, next) {
    try {
        const { search, category, featured, page = '1', limit = '12' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const where = { deletedAt: null };
        if (category && category !== 'ALL') {
            where.OR = [
                { category: { slug: category } },
                { category: { name: category } },
                { categoryName: { contains: category, mode: 'insensitive' } },
            ];
        }
        if (featured === 'true')
            where.featured = true;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { hostName: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [programs, total] = await Promise.all([
            prisma_1.prisma.program.findMany({
                where,
                include: {
                    host: true,
                    category: true,
                    schedules: true,
                },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.program.count({ where }),
        ]);
        return res.json({
            success: true,
            data: programs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        next(error);
    }
}
async function getProgramBySlug(req, res, next) {
    try {
        const slug = req.params.slug;
        const program = await prisma_1.prisma.program.findFirst({
            where: {
                OR: [{ slug }, { id: slug }],
                deletedAt: null,
            },
            include: {
                host: true,
                category: true,
                schedules: true,
            },
        });
        if (!program) {
            return res.status(404).json({ success: false, message: 'Program not found' });
        }
        return res.json({ success: true, data: program });
    }
    catch (error) {
        next(error);
    }
}
async function createProgram(req, res, next) {
    try {
        const data = index_1.programSchema.parse(req.body);
        const isDuplicate = await (0, duplicate_1.checkDuplicateProgram)(data.name);
        if (isDuplicate) {
            return res.status(400).json({
                success: false,
                message: `A program with the name "${data.name}" already exists.`,
            });
        }
        let slug = (0, slug_1.generateSlug)(data.name);
        const existing = await prisma_1.prisma.program.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
        const program = await prisma_1.prisma.program.create({
            data: {
                name: data.name,
                slug,
                description: data.description,
                hostId: data.hostId,
                hostName: data.hostName || 'Radio Ninada RJ',
                categoryId: data.categoryId,
                categoryName: data.categoryName || 'Music',
                thumbnail: data.thumbnail,
                thumbnailPublicId: data.thumbnailPublicId,
                banner: data.banner,
                bannerPublicId: data.bannerPublicId,
                duration: data.duration,
                language: data.language,
                tags: data.tags,
                schedule: data.schedule || 'Daily Broadcast',
                featured: data.featured,
                status: data.status,
            },
            include: {
                host: true,
                category: true,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'Program created successfully',
            data: program,
        });
    }
    catch (error) {
        next(error);
    }
}
async function deleteProgram(req, res, next) {
    try {
        const id = req.params.id;
        const program = await prisma_1.prisma.program.findUnique({
            where: { id },
        });
        if (!program) {
            return res.status(404).json({ success: false, message: 'Program not found' });
        }
        if (program.thumbnailPublicId) {
            await (0, cloudinary_service_1.deleteFileFromCloudinary)(program.thumbnailPublicId, 'image');
        }
        if (program.bannerPublicId) {
            await (0, cloudinary_service_1.deleteFileFromCloudinary)(program.bannerPublicId, 'image');
        }
        await prisma_1.prisma.program.delete({
            where: { id: program.id },
        });
        return res.json({ success: true, message: 'Program deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
