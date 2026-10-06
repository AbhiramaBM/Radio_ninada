"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPodcasts = getPodcasts;
exports.getPodcastBySlug = getPodcastBySlug;
exports.createPodcast = createPodcast;
exports.addEpisode = addEpisode;
exports.incrementDownload = incrementDownload;
exports.proxyDownloadEpisode = proxyDownloadEpisode;
exports.deletePodcast = deletePodcast;
exports.updatePodcast = updatePodcast;
const prisma_1 = require("../config/prisma");
const slug_1 = require("../utils/slug");
const duplicate_1 = require("../utils/duplicate");
const index_1 = require("../validation/index");
const cloudinary_service_1 = require("../services/cloudinary.service");
const logger_1 = require("../utils/logger");
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
                audioUrl: data.audioUrl,
                audioPublicId: data.audioPublicId,
                duration: data.duration || '30:00',
                categoryId: data.categoryId,
                hostId: data.hostId,
                featured: data.featured,
                status: data.status,
                ...(data.audioUrl
                    ? {
                        episodes: {
                            create: {
                                title: data.title,
                                description: data.description,
                                audioUrl: data.audioUrl,
                                audioPublicId: data.audioPublicId,
                                coverUrl: data.coverUrl,
                                coverPublicId: data.coverPublicId,
                                duration: data.duration || '30:00',
                                episodeNumber: 1,
                                season: 1,
                            },
                        },
                    }
                    : {}),
            },
            include: {
                category: true,
                host: true,
                episodes: true,
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
 * Proxy-download episode/podcast audio via server to force browser file save dialog.
 * Handles Cloudinary CORS, redirects, query parameters, transformations, and disposition.
 * GET /api/podcasts/episodes/:id/proxy-download
 * GET /api/podcasts/download
 */
async function proxyDownloadEpisode(req, res, next) {
    try {
        const id = ((req.params.id || req.query.id || '') || '').trim();
        let audioUrl = ((req.query.url || '') || '').trim();
        let title = ((req.query.title || '') || '').trim();
        // 1. If an ID is provided, look up the episode or podcast from the database
        if (id && id !== 'audio' && id !== 'direct') {
            try {
                const episode = await prisma_1.prisma.podcastEpisode.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        title: true,
                        audioUrl: true,
                        podcast: { select: { title: true } },
                    },
                });
                if (episode && episode.audioUrl) {
                    if (!audioUrl)
                        audioUrl = episode.audioUrl;
                    if (!title)
                        title = episode.title || episode.podcast?.title || '';
                    prisma_1.prisma.podcastEpisode.update({
                        where: { id },
                        data: { downloads: { increment: 1 } },
                    }).catch(() => { });
                }
                else {
                    // If not found as episode, look up as podcast
                    const podcast = await prisma_1.prisma.podcast.findUnique({
                        where: { id },
                        select: {
                            id: true,
                            title: true,
                            audioUrl: true,
                            episodes: {
                                where: { deletedAt: null },
                                orderBy: { episodeNumber: 'asc' },
                                take: 1,
                                select: { id: true, title: true, audioUrl: true },
                            },
                        },
                    });
                    if (podcast) {
                        const firstEp = podcast.episodes && podcast.episodes[0];
                        if (!audioUrl)
                            audioUrl = firstEp?.audioUrl || podcast.audioUrl || '';
                        if (!title)
                            title = firstEp?.title || podcast.title || '';
                        prisma_1.prisma.podcast.update({
                            where: { id },
                            data: { downloads: { increment: 1 } },
                        }).catch(() => { });
                    }
                }
            }
            catch (dbError) {
                logger_1.logger.warn(`[ProxyDownload] DB lookup skipped or failed for id "${id}":`, dbError);
            }
        }
        // 2. Validate that an audio URL is available
        if (!audioUrl) {
            return res.status(404).json({
                success: false,
                message: 'Audio URL not found for this episode.',
            });
        }
        // 3. Normalize Cloudinary URLs (upgrade http to https for Cloudinary)
        if (audioUrl.startsWith('http://res.cloudinary.com')) {
            audioUrl = audioUrl.replace('http://res.cloudinary.com', 'https://res.cloudinary.com');
        }
        // 4. Sanitize title to an appropriate filename
        const rawTitle = title || 'Radio_Ninada_Audio';
        const safeTitle = rawTitle
            .replace(/[\/\\:*?"<>|]/g, '_')
            .replace(/\s+/g, '_')
            .trim() || 'Radio_Ninada_Episode';
        // Detect extension from audio URL pathname (default to mp3)
        let ext = 'mp3';
        try {
            const parsed = new URL(audioUrl, 'http://localhost');
            const match = parsed.pathname.match(/\.(mp3|m4a|ogg|wav|aac|flac)$/i);
            if (match)
                ext = match[1].toLowerCase();
        }
        catch (_) { }
        const fileName = `${safeTitle}.${ext}`;
        const encodedFileName = encodeURIComponent(fileName);
        // 5. Fetch from upstream (Cloudinary / CDN) with redirect following
        const upstreamRes = await fetch(audioUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': 'RadioNinada/1.0',
                'Accept': '*/*',
                ...(req.headers.range ? { Range: req.headers.range } : {}),
            },
        });
        if (!upstreamRes.ok) {
            logger_1.logger.error(`[ProxyDownload] Upstream returned status ${upstreamRes.status} for ${audioUrl}`);
            return res.status(upstreamRes.status === 404 ? 404 : 502).json({
                success: false,
                message: `Audio storage server returned HTTP ${upstreamRes.status}: ${upstreamRes.statusText}`,
            });
        }
        // 6. Set response headers for direct download
        const rawContentType = upstreamRes.headers.get('content-type') || '';
        const contentType = (rawContentType.includes('audio') || rawContentType.includes('mpeg'))
            ? rawContentType
            : (ext === 'mp3' ? 'audio/mpeg' : `audio/${ext}`);
        const contentLength = upstreamRes.headers.get('content-length');
        const contentRange = upstreamRes.headers.get('content-range');
        res.status(upstreamRes.status);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');
        if (contentLength)
            res.setHeader('Content-Length', contentLength);
        if (contentRange)
            res.setHeader('Content-Range', contentRange);
        // 7. Stream audio to client
        if (upstreamRes.body) {
            const { Readable } = await import('stream');
            const stream = Readable.fromWeb(upstreamRes.body);
            stream.pipe(res);
            stream.on('error', (err) => {
                logger_1.logger.error('[ProxyDownload] Streaming error:', err);
                if (!res.headersSent) {
                    res.status(502).json({ success: false, message: 'Stream interrupted while sending audio file.' });
                }
            });
        }
        else {
            res.end();
        }
    }
    catch (error) {
        logger_1.logger.error('[ProxyDownload] Unexpected error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: `Failed to download audio: ${error.message || 'Internal server error'}`,
            });
        }
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
/**
 * Update podcast and sync default episode
 * PUT /api/podcasts/:id
 */
async function updatePodcast(req, res, next) {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.podcast.findUnique({
            where: { id },
            include: { episodes: true },
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Podcast not found' });
        }
        const { title, description, coverUrl, coverPublicId, audioUrl, audioPublicId, duration, categoryId, hostId, featured, status, } = req.body;
        if (title && title !== existing.title) {
            const isDup = await (0, duplicate_1.checkDuplicatePodcast)(title, id);
            if (isDup) {
                return res.status(400).json({
                    success: false,
                    message: `A podcast with the title "${title}" already exists.`,
                });
            }
        }
        if (coverPublicId && existing.coverPublicId && existing.coverPublicId !== coverPublicId) {
            try {
                await (0, cloudinary_service_1.deleteFileFromCloudinary)(existing.coverPublicId, 'image');
            }
            catch (e) {
                console.warn('Old podcast cover cleanup warning:', e);
            }
        }
        if (audioPublicId && existing.audioPublicId && existing.audioPublicId !== audioPublicId) {
            try {
                await (0, cloudinary_service_1.deleteFileFromCloudinary)(existing.audioPublicId, 'video');
            }
            catch (e) {
                console.warn('Old podcast audio cleanup warning:', e);
            }
        }
        const updated = await prisma_1.prisma.podcast.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(coverUrl !== undefined && { coverUrl }),
                ...(coverPublicId !== undefined && { coverPublicId }),
                ...(audioUrl !== undefined && { audioUrl }),
                ...(audioPublicId !== undefined && { audioPublicId }),
                ...(duration !== undefined && { duration }),
                ...(categoryId !== undefined && { categoryId }),
                ...(hostId !== undefined && { hostId }),
                ...(featured !== undefined && { featured }),
                ...(status !== undefined && { status }),
            },
            include: {
                category: true,
                host: true,
                episodes: true,
            },
        });
        if (existing.episodes && existing.episodes.length > 0) {
            const firstEp = existing.episodes[0];
            await prisma_1.prisma.podcastEpisode.update({
                where: { id: firstEp.id },
                data: {
                    ...(title !== undefined && { title }),
                    ...(description !== undefined && { description }),
                    ...(audioUrl !== undefined && { audioUrl }),
                    ...(audioPublicId !== undefined && { audioPublicId }),
                    ...(coverUrl !== undefined && { coverUrl }),
                    ...(coverPublicId !== undefined && { coverPublicId }),
                    ...(duration !== undefined && { duration }),
                },
            });
        }
        return res.json({
            success: true,
            message: 'Podcast updated successfully',
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
}
