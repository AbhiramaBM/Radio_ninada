import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { generateSlug } from '../utils/slug';
import { podcastSchema, episodeSchema } from '../validation/index';
import { deleteFileFromCloudinary } from '../services/cloudinary.service';

/**
 * List podcasts with episodes & host info
 * GET /api/podcasts
 */
export async function getPodcasts(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, category, featured, page = '1', limit = '12' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = { deletedAt: null };
    if (category && category !== 'ALL') {
      where.OR = [
        { category: { slug: category as string } },
        { category: { name: category as string } },
      ];
    }
    if (featured === 'true') where.featured = true;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [total, podcasts] = await Promise.all([
      prisma.podcast.count({ where }),
      prisma.podcast.findMany({
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
  } catch (error) {
    next(error);
  }
}

/**
 * Get podcast by slug or ID
 * GET /api/podcasts/:slug
 */
export async function getPodcastBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;
    const podcast = await prisma.podcast.findFirst({
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
  } catch (error) {
    next(error);
  }
}

/**
 * Create new podcast
 * POST /api/podcasts
 */
export async function createPodcast(req: Request, res: Response, next: NextFunction) {
  try {
    const data = podcastSchema.parse(req.body);
    let slug = generateSlug(data.title);

    // Verify slug uniqueness
    const count = await prisma.podcast.count({ where: { slug } });
    if (count > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const podcast = await prisma.podcast.create({
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
  } catch (error) {
    next(error);
  }
}

/**
 * Add episode to podcast
 * POST /api/podcasts/:id/episodes
 */
export async function addEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const data = episodeSchema.parse({
      ...req.body,
      podcastId: req.params.id,
    });

    const episode = await prisma.podcastEpisode.create({
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
  } catch (error) {
    next(error);
  }
}

/**
 * Increment episode download counter
 * POST /api/podcasts/episodes/:id/download
 */
export async function incrementDownload(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const episode = await prisma.podcastEpisode.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });
    return res.json({ success: true, downloads: episode.downloads });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete podcast and associated episodes
 * DELETE /api/podcasts/:id
 */
export async function deletePodcast(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const podcast = await prisma.podcast.findUnique({
      where: { id },
      include: { episodes: true },
    });

    if (!podcast) {
      return res.status(404).json({ success: false, message: 'Podcast not found' });
    }

    // Delete cover from Cloudinary if present
    if (podcast.coverPublicId) {
      await deleteFileFromCloudinary(podcast.coverPublicId, 'image');
    }

    // Delete episode audio from Cloudinary
    for (const ep of podcast.episodes) {
      if (ep.audioPublicId) {
        await deleteFileFromCloudinary(ep.audioPublicId, 'video');
      }
    }

    await prisma.podcast.delete({
      where: { id: podcast.id },
    });

    return res.json({
      success: true,
      message: 'Podcast and associated episodes deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
