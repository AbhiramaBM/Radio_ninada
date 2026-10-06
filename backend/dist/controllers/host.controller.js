"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listHosts = listHosts;
exports.getHostById = getHostById;
exports.createHost = createHost;
exports.deleteHost = deleteHost;
exports.updateHost = updateHost;
const prisma_1 = require("../config/prisma");
const index_1 = require("../validation/index");
const cloudinary_service_1 = require("../services/cloudinary.service");
async function listHosts(req, res, next) {
    try {
        const hosts = await prisma_1.prisma.host.findMany({
            where: { deletedAt: null },
            include: {
                programs: { where: { deletedAt: null } },
                podcasts: { where: { deletedAt: null } },
            },
            orderBy: { name: 'asc' },
        });
        return res.json({ success: true, data: hosts });
    }
    catch (error) {
        next(error);
    }
}
async function getHostById(req, res, next) {
    try {
        const id = req.params.id;
        const host = await prisma_1.prisma.host.findFirst({
            where: { id, deletedAt: null },
            include: {
                programs: true,
                podcasts: true,
            },
        });
        if (!host) {
            return res.status(404).json({ success: false, message: 'Host not found' });
        }
        return res.json({ success: true, data: host });
    }
    catch (error) {
        next(error);
    }
}
async function createHost(req, res, next) {
    try {
        const data = index_1.hostSchema.parse(req.body);
        const host = await prisma_1.prisma.host.create({
            data: {
                name: data.name,
                designation: data.designation,
                bio: data.bio,
                photoUrl: data.photoUrl,
                publicId: data.publicId,
                socialMedia: data.socialMedia,
                achievements: data.achievements,
                status: data.status,
            },
        });
        return res.status(201).json({ success: true, message: 'Host profile created', data: host });
    }
    catch (error) {
        next(error);
    }
}
async function deleteHost(req, res, next) {
    try {
        const id = req.params.id;
        const host = await prisma_1.prisma.host.findUnique({ where: { id } });
        if (!host) {
            return res.status(404).json({ success: false, message: 'Host not found' });
        }
        if (host.publicId) {
            await (0, cloudinary_service_1.deleteFileFromCloudinary)(host.publicId, 'image');
        }
        await prisma_1.prisma.host.delete({ where: { id: host.id } });
        return res.json({ success: true, message: 'Host deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function updateHost(req, res, next) {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.host.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Host not found' });
        }
        const { name, designation, bio, photoUrl, publicId, socialMedia, achievements, status } = req.body;
        if (publicId && existing.publicId && existing.publicId !== publicId) {
            try {
                await (0, cloudinary_service_1.deleteFileFromCloudinary)(existing.publicId, 'image');
            }
            catch (e) {
                console.warn('Old host photo cleanup warning:', e);
            }
        }
        const updated = await prisma_1.prisma.host.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(designation !== undefined && { designation }),
                ...(bio !== undefined && { bio }),
                ...(photoUrl !== undefined && { photoUrl }),
                ...(publicId !== undefined && { publicId }),
                ...(socialMedia !== undefined && { socialMedia }),
                ...(achievements !== undefined && { achievements }),
                ...(status !== undefined && { status }),
            },
        });
        return res.json({ success: true, message: 'Host profile updated successfully', data: updated });
    }
    catch (error) {
        next(error);
    }
}
