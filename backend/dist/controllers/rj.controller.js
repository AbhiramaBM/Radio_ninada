"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRJs = getRJs;
exports.createRJ = createRJ;
exports.updateRJ = updateRJ;
exports.deleteRJ = deleteRJ;
const prisma_1 = require("../config/prisma");
async function getRJs(req, res, next) {
    try {
        const { search, status } = req.query;
        const where = { deletedAt: null };
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { designation: { contains: search } },
                { bio: { contains: search } },
            ];
        }
        const rjs = await prisma_1.prisma.rJProfile.findMany({
            where,
            orderBy: { followers: 'desc' },
        });
        return res.json({ success: true, data: rjs });
    }
    catch (error) {
        next(error);
    }
}
async function createRJ(req, res, next) {
    try {
        const { name, photo, designation, bio, socialMedia, achievements, status } = req.body;
        const rj = await prisma_1.prisma.rJProfile.create({
            data: {
                name,
                photo: photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
                designation: designation || 'RJ / Host',
                bio: bio || 'Radio Ninada Presenter',
                socialMedia: typeof socialMedia === 'object' ? JSON.stringify(socialMedia) : socialMedia,
                achievements,
                status: status || 'ACTIVE',
            },
        });
        return res.status(201).json({ success: true, message: 'RJ Profile created successfully', data: rj });
    }
    catch (error) {
        next(error);
    }
}
async function updateRJ(req, res, next) {
    try {
        const id = req.params.id;
        const data = req.body;
        const updated = await prisma_1.prisma.rJProfile.update({
            where: { id },
            data: {
                ...data,
                ...(data.socialMedia && typeof data.socialMedia === 'object' && { socialMedia: JSON.stringify(data.socialMedia) }),
            },
        });
        return res.json({ success: true, message: 'RJ Profile updated successfully', data: updated });
    }
    catch (error) {
        next(error);
    }
}
async function deleteRJ(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.rJProfile.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return res.json({ success: true, message: 'RJ Profile deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
