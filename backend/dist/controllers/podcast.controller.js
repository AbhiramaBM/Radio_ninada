"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPodcasts = getPodcasts;
exports.createPodcast = createPodcast;
exports.updatePodcast = updatePodcast;
exports.incrementDownloads = incrementDownloads;
exports.deletePodcast = deletePodcast;
const prisma_1 = require("../config/prisma");
const slug_1 = require("../utils/slug");
const duplicate_1 = require("../utils/duplicate");
const index_1 = require("../validation/index");
async function getPodcasts(req, res, next) {
    try {
        const { search, category, visibility, featured, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const where = { deletedAt: null };
        if (category)
            where.category = category;
        if (visibility)
            where.visibility = visibility;
        if (featured === 'true')
            where.featured = true;
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { category: { contains: search } },
            ];
        }
        const [podcasts, total] = await Promise.all([
            prisma_1.prisma.podcast.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.podcast.count({ where }),
        ]);
        return res.json({
            success: true,
            data: podcasts,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    }
    catch (error) {
        next(error);
    }
}
async function createPodcast(req, res, next) {
    try {
        const files = req.files;
        let audioUrl = req.body.audioUrl;
        let coverUrl = req.body.coverUrl;
        if (files?.audio?.[0]) {
            audioUrl = `/uploads/${files.audio[0].filename}`;
        }
        if (files?.cover?.[0]) {
            coverUrl = `/uploads/${files.cover[0].filename}`;
        }
        const rawData = {
            ...req.body,
            episodeNumber: parseInt(req.body.episodeNumber || '1', 10),
            season: parseInt(req.body.season || '1', 10),
            audioUrl: audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            coverUrl: coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
        };
        const data = index_1.podcastSchema.parse(rawData);
        const isDuplicate = await (0, duplicate_1.checkDuplicatePodcast)(data.title, data.episodeNumber, data.season);
        if (isDuplicate) {
            return res.status(400).json({
                success: false,
                message: `Duplicate Warning: Podcast episode S${data.season}E${data.episodeNumber} or title "${data.title}" already exists.`,
            });
        }
        let slug = (0, slug_1.generateSlug)(data.title);
        const existingSlug = await prisma_1.prisma.podcast.findUnique({ where: { slug } });
        if (existingSlug) {
            slug = `${slug}-s${data.season}e${data.episodeNumber}`;
        }
        const podcast = await prisma_1.prisma.podcast.create({
            data: { ...data, slug },
        });
        return res.status(201).json({ success: true, message: 'Podcast published successfully', data: podcast });
    }
    catch (error) {
        next(error);
    }
}
async function updatePodcast(req, res, next) {
    try {
        const id = req.params.id;
        const data = req.body;
        if (data.title || data.episodeNumber || data.season) {
            const existing = await prisma_1.prisma.podcast.findUnique({ where: { id } });
            if (existing) {
                const title = data.title || existing.title;
                const episode = data.episodeNumber ? parseInt(data.episodeNumber, 10) : existing.episodeNumber;
                const season = data.season ? parseInt(data.season, 10) : existing.season;
                const isDup = await (0, duplicate_1.checkDuplicatePodcast)(title, episode, season, id);
                if (isDup) {
                    return res.status(400).json({
                        success: false,
                        message: `Duplicate Warning: Episode title or S${season}E${episode} already exists.`,
                    });
                }
            }
        }
        const updated = await prisma_1.prisma.podcast.update({
            where: { id },
            data: {
                ...data,
                ...(data.episodeNumber && { episodeNumber: parseInt(data.episodeNumber, 10) }),
                ...(data.season && { season: parseInt(data.season, 10) }),
            },
        });
        return res.json({ success: true, message: 'Podcast updated successfully', data: updated });
    }
    catch (error) {
        next(error);
    }
}
async function incrementDownloads(req, res, next) {
    try {
        const id = req.params.id;
        const updated = await prisma_1.prisma.podcast.update({
            where: { id },
            data: { downloads: { increment: 1 } },
        });
        return res.json({ success: true, data: { downloads: updated.downloads } });
    }
    catch (error) {
        next(error);
    }
}
async function deletePodcast(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.podcast.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return res.json({ success: true, message: 'Podcast deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
