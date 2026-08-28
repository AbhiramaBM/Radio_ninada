"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPodcasts = getPodcasts;
exports.getPodcastBySlug = getPodcastBySlug;
exports.createPodcast = createPodcast;
exports.updatePodcast = updatePodcast;
exports.incrementDownloads = incrementDownloads;
exports.deletePodcast = deletePodcast;
const prisma_1 = require("../config/prisma");
const slug_1 = require("../utils/slug");
const duplicate_1 = require("../utils/duplicate");
const index_1 = require("../validation/index");
const cloudinary_service_1 = require("../services/cloudinary.service");
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
            ];
        }
        const total = await prisma_1.prisma.podcast.count({ where });
        const podcasts = await prisma_1.prisma.podcast.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
        });
        return res.json({
            success: true,
            data: podcasts,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        next(error);
    }
}
async function getPodcastBySlug(req, res, next) {
    try {
        const podcast = await prisma_1.prisma.podcast.findFirst({
            where: { slug: req.params.slug, deletedAt: null },
        });
        if (!podcast) {
            return res.status(404).json({ success: false, message: 'Podcast not found' });
        }
        return res.json({ success: true, data: podcast });
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
        let audioPublicId = req.body.audioPublicId || req.body.audioCloudinaryPublicId || null;
        let coverPublicId = req.body.coverPublicId || req.body.coverCloudinaryPublicId || null;
        if (files?.audio?.[0]) {
            const f = files.audio[0];
            audioUrl = f.path && (f.path.startsWith('http://') || f.path.startsWith('https://')) ? f.path : `/uploads/${f.filename}`;
            audioPublicId = f.public_id || (0, cloudinary_service_1.extractPublicIdFromUrl)(audioUrl);
        }
        if (files?.cover?.[0]) {
            const f = files.cover[0];
            coverUrl = f.path && (f.path.startsWith('http://') || f.path.startsWith('https://')) ? f.path : `/uploads/${f.filename}`;
            coverPublicId = f.public_id || (0, cloudinary_service_1.extractPublicIdFromUrl)(coverUrl);
        }
        if (!audioPublicId && audioUrl) {
            audioPublicId = (0, cloudinary_service_1.extractPublicIdFromUrl)(audioUrl);
        }
        if (!coverPublicId && coverUrl) {
            coverPublicId = (0, cloudinary_service_1.extractPublicIdFromUrl)(coverUrl);
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
            data: {
                ...data,
                slug,
                audioPublicId,
                coverPublicId,
            },
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
        let audioPublicId = data.audioPublicId || data.audioCloudinaryPublicId;
        let coverPublicId = data.coverPublicId || data.coverCloudinaryPublicId;
        if (!audioPublicId && data.audioUrl) {
            audioPublicId = (0, cloudinary_service_1.extractPublicIdFromUrl)(data.audioUrl);
        }
        if (!coverPublicId && data.coverUrl) {
            coverPublicId = (0, cloudinary_service_1.extractPublicIdFromUrl)(data.coverUrl);
        }
        const updated = await prisma_1.prisma.podcast.update({
            where: { id },
            data: {
                ...data,
                ...(data.episodeNumber && { episodeNumber: parseInt(data.episodeNumber, 10) }),
                ...(data.season && { season: parseInt(data.season, 10) }),
                ...(audioPublicId && { audioPublicId }),
                ...(coverPublicId && { coverPublicId }),
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
        const podcast = await prisma_1.prisma.podcast.findUnique({ where: { id } });
        if (podcast) {
            const audioPid = podcast.audioPublicId || (0, cloudinary_service_1.extractPublicIdFromUrl)(podcast.audioUrl);
            if (audioPid) {
                await (0, cloudinary_service_1.deleteFileFromCloudinary)(audioPid, 'video'); // Audio is stored under resource_type 'video'
            }
            if (podcast.coverUrl) {
                const coverPid = podcast.coverPublicId || (0, cloudinary_service_1.extractPublicIdFromUrl)(podcast.coverUrl);
                if (coverPid) {
                    await (0, cloudinary_service_1.deleteFileFromCloudinary)(coverPid, 'image');
                }
            }
        }
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
