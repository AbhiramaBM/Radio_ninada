"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
exports.createCategory = createCategory;
exports.deleteCategory = deleteCategory;
const prisma_1 = require("../config/prisma");
const index_1 = require("../validation/index");
const slug_1 = require("../utils/slug");
async function listCategories(req, res, next) {
    try {
        const categories = await prisma_1.prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
        return res.json({ success: true, data: categories });
    }
    catch (error) {
        next(error);
    }
}
async function createCategory(req, res, next) {
    try {
        const data = index_1.categorySchema.parse(req.body);
        const slug = (0, slug_1.generateSlug)(data.name);
        const existing = await prisma_1.prisma.category.findUnique({ where: { slug } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Category already exists' });
        }
        const category = await prisma_1.prisma.category.create({
            data: {
                name: data.name,
                slug,
                description: data.description,
                type: data.type,
            },
        });
        return res.status(201).json({ success: true, data: category });
    }
    catch (error) {
        next(error);
    }
}
async function deleteCategory(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.category.delete({
            where: { id },
        });
        return res.json({ success: true, message: 'Category deleted' });
    }
    catch (error) {
        next(error);
    }
}
