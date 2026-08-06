"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSponsors = getSponsors;
exports.createSponsor = createSponsor;
exports.trackSponsorClick = trackSponsorClick;
exports.deleteSponsor = deleteSponsor;
const prisma_1 = require("../config/prisma");
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
        if (file) {
            logoUrl = `/uploads/${file.filename}`;
        }
        const { name, website, campaign, expiryDate, status } = req.body;
        const sponsor = await prisma_1.prisma.sponsor.create({
            data: {
                name,
                logoUrl: logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
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
        await prisma_1.prisma.sponsor.delete({ where: { id } });
        return res.json({ success: true, message: 'Sponsor removed' });
    }
    catch (error) {
        next(error);
    }
}
