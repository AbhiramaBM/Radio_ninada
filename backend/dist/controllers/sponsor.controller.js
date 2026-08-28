"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSponsors = getSponsors;
exports.createSponsor = createSponsor;
exports.trackSponsorClick = trackSponsorClick;
exports.deleteSponsor = deleteSponsor;
const prisma_1 = require("../config/prisma");
const cloudinary_service_1 = require("../services/cloudinary.service");
async function getSponsors(req, res, next) {
    try {
        const sponsors = await prisma_1.prisma.sponsor.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: sponsors });
    }
    catch (error) {
        next(error);
    }
}
async function createSponsor(req, res, next) {
    try {
        const file = req.file;
        let logoUrl = req.body.logoUrl;
        let publicId = req.body.publicId || req.body.cloudinaryPublicId || null;
        if (file) {
            logoUrl = file.path && (file.path.startsWith('http://') || file.path.startsWith('https://')) ? file.path : `/uploads/${file.filename}`;
            publicId = file.public_id || (0, cloudinary_service_1.extractPublicIdFromUrl)(logoUrl);
        }
        if (!publicId && logoUrl) {
            publicId = (0, cloudinary_service_1.extractPublicIdFromUrl)(logoUrl);
        }
        const { name, website, campaign, expiryDate, status } = req.body;
        const sponsor = await prisma_1.prisma.sponsor.create({
            data: {
                name,
                logoUrl: logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
                publicId,
                website,
                campaign: campaign || 'Brand Partnership',
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                status: status || 'ACTIVE',
            },
        });
        return res.status(201).json({ success: true, message: 'Sponsor added successfully', data: sponsor });
    }
    catch (error) {
        next(error);
    }
}
async function trackSponsorClick(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.sponsor.update({
            where: { id },
            data: { clicks: { increment: 1 } },
        });
        return res.json({ success: true, message: 'Sponsor click registered' });
    }
    catch (error) {
        next(error);
    }
}
async function deleteSponsor(req, res, next) {
    try {
        const id = req.params.id;
        const sponsor = await prisma_1.prisma.sponsor.findUnique({ where: { id } });
        if (sponsor) {
            const pid = sponsor.publicId || (0, cloudinary_service_1.extractPublicIdFromUrl)(sponsor.logoUrl);
            if (pid) {
                await (0, cloudinary_service_1.deleteFileFromCloudinary)(pid, 'image');
            }
        }
        await prisma_1.prisma.sponsor.delete({ where: { id } });
        return res.json({ success: true, message: 'Sponsor removed' });
    }
    catch (error) {
        next(error);
    }
}
