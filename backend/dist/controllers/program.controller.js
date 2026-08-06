"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrograms = getPrograms;
exports.createProgram = createProgram;
exports.updateProgram = updateProgram;
exports.deleteProgram = deleteProgram;
exports.bulkDeletePrograms = bulkDeletePrograms;
exports.bulkPublishPrograms = bulkPublishPrograms;
const prisma_1 = require("../config/prisma");
const slug_1 = require("../utils/slug");
const duplicate_1 = require("../utils/duplicate");
const index_1 = require("../validation/index");
async function getPrograms(req, res, next) {
    try {
        const { search, category, status, featured, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const where = { deletedAt: null };
        if (category)
            where.category = category;
        if (status)
            where.status = status;
        if (featured === 'true')
            where.featured = true;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } },
                { hostName: { contains: search } },
                { tags: { contains: search } },
            ];
        }
        const [programs, total] = await Promise.all([
            prisma_1.prisma.program.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.program.count({ where }),
        ]);
        return res.json({
            success: true,
            data: programs,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
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
                message: `Duplicate Warning: A program with the name "${data.name}" already exists.`,
            });
        }
        let slug = (0, slug_1.generateSlug)(data.name);
        const existingSlug = await prisma_1.prisma.program.findUnique({ where: { slug } });
        if (existingSlug) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
        const program = await prisma_1.prisma.program.create({
            data: { ...data, slug },
        });
        return res.status(201).json({ success: true, message: 'Program created successfully', data: program });
    }
    catch (error) {
        next(error);
    }
}
async function updateProgram(req, res, next) {
    try {
        const id = req.params.id;
        const data = req.body;
        if (data.name) {
            const isDuplicate = await (0, duplicate_1.checkDuplicateProgram)(data.name, id);
            if (isDuplicate) {
                return res.status(400).json({
                    success: false,
                    message: `Duplicate Warning: A program with the name "${data.name}" already exists.`,
                });
            }
        }
        const updated = await prisma_1.prisma.program.update({
            where: { id },
            data,
        });
        return res.json({ success: true, message: 'Program updated successfully', data: updated });
    }
    catch (error) {
        next(error);
    }
}
async function deleteProgram(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.program.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return res.json({ success: true, message: 'Program deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function bulkDeletePrograms(req, res, next) {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || !ids.length) {
            return res.status(400).json({ success: false, message: 'Array of program IDs required' });
        }
        await prisma_1.prisma.program.updateMany({
            where: { id: { in: ids } },
            data: { deletedAt: new Date() },
        });
        return res.json({ success: true, message: `${ids.length} programs deleted successfully` });
    }
    catch (error) {
        next(error);
    }
}
async function bulkPublishPrograms(req, res, next) {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || !ids.length) {
            return res.status(400).json({ success: false, message: 'Array of program IDs required' });
        }
        await prisma_1.prisma.program.updateMany({
            where: { id: { in: ids } },
            data: { status: 'PUBLISHED' },
        });
        return res.json({ success: true, message: `${ids.length} programs published successfully` });
    }
    catch (error) {
        next(error);
    }
}
