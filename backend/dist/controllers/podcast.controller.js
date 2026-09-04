"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPodcasts = getPodcasts;
exports.getPodcastBySlug = getPodcastBySlug;
exports.createPodcast = createPodcast;
exports.addEpisode = addEpisode;
exports.incrementDownload = incrementDownload;
exports.deletePodcast = deletePodcast;
const prisma_1 = require("../config/prisma");
const slug_1 = require("../utils/slug");
const index_1 = require("../validation/index");
const cloudinary_service_1 = require("../services/cloudinary.service");
/**
 * List podcasts with episodes & host info
 * GET /api/podcasts
 */
async function getPodcasts(req, res, next) {
    try {
        const { search, category, featured, page = '1', limit = '12' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const where = { deletedAt: null };
        if (category && category !== 'ALL') {
            where.OR = [
                { category: { slug: category } },
                { category: { name: category } },
            ];
        }
        if (featured === 'true')
            where.featured = true;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [total, podcasts] = await Promise.all([
            prisma_1.prisma.podcast.count({ where }),
            prisma_1.prisma.podcast.findMany({
                where,
                include: {
                    category: true,
                    host: true,
                    episodes: {
                        where: { deletedAt: null },
                        orderBy: { episodeNumber: 'asc' },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
        ]);
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
/**
 * Get podcast by slug or ID
 * GET /api/podcasts/:slug
 */
async function getPodcastBySlug(req, res, next) {
    try {
        const slug = req.params.slug;
        const podcast = await prisma_1.prisma.podcast.findFirst({
            where: {
                OR: [{ slug }, { id: slug }],
                deletedAt: null,
            },
            include: {
                category: true,
                host: true,
                episodes: {
                    where: { deletedAt: null },
                    orderBy: { episodeNumber: 'asc' },
                    include: { media: true },
                },
            },
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
/**
 * Create new podcast
 * POST /api/podcasts
 */
async function createPodcast(req, res, next) {
    try {
        const data = index_1.podcastSchema.parse(req.body);
        let slug = (0, slug_1.generateSlug)(data.title);
        // Verify slug uniqueness
        const count = await prisma_1.prisma.podcast.count({ where: { slug } });
        if (count > 0) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
        const podcast = await prisma_1.prisma.podcast.create({
            data: {
                title: data.title,
                slug,
                description: data.description,
                coverUrl: data.coverUrl,
                coverPublicId: data.coverPublicId,
                categoryId: data.categoryId,
                hostId: data.hostId,
                featured: data.featured,
                status: data.status,
            },
            include: {
                category: true,
                host: true,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'Podcast created successfully',
            data: podcast,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Add episode to podcast
 * POST /api/podcasts/:id/episodes
 */
async function addEpisode(req, res, next) {
    try {
        const data = index_1.episodeSchema.parse({
            ...req.body,
            podcastId: req.params.id,
        });
        const episode = await prisma_1.prisma.podcastEpisode.create({
            data: {
                podcastId: data.podcastId,
                title: data.title,
                description: data.description,
                episodeNumber: data.episodeNumber,
                season: data.season,
                audioUrl: data.audioUrl,
                audioPublicId: data.audioPublicId,
                coverUrl: data.coverUrl,
                coverPublicId: data.coverPublicId,
                duration: data.duration,
                mediaId: data.mediaId,
                status: data.status,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'Episode added successfully',
            data: episode,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Increment episode download counter
 * POST /api/podcasts/episodes/:id/download
 */
async function incrementDownload(req, res, next) {
    try {
        const id = req.params.id;
        const episode = await prisma_1.prisma.podcastEpisode.update({
            where: { id },
            data: { downloads: { increment: 1 } },
        });
        return res.json({ success: true, downloads: episode.downloads });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Delete podcast and associated episodes
 * DELETE /api/podcasts/:id
 */
async function deletePodcast(req, res, next) {
    try {
        const id = req.params.id;
        const podcast = await prisma_1.prisma.podcast.findUnique({
            where: { id },
            include: { episodes: true },
        });
        if (!podcast) {
            return res.status(404).json({ success: false, message: 'Podcast not found' });
        }
        // Delete cover from Cloudinary if present
        if (podcast.coverPublicId) {
            await (0, cloudinary_service_1.deleteFileFromCloudinary)(podcast.coverPublicId, 'image');
        }
        // Delete episode audio from Cloudinary
        for (const ep of podcast.episodes) {
            if (ep.audioPublicId) {
                await (0, cloudinary_service_1.deleteFileFromCloudinary)(ep.audioPublicId, 'video');
            }
        }
        await prisma_1.prisma.podcast.delete({
            where: { id: podcast.id },
        });
        return res.json({
            success: true,
            message: 'Podcast and associated episodes deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
}
