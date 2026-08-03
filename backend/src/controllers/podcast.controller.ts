import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { generateSlug } from '../utils/slug';
import { checkDuplicatePodcast } from '../utils/duplicate';
import { podcastSchema } from '../validation/index';

export async function getPodcasts(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, category, visibility, featured, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = { deletedAt: null };
    if (category) where.category = category as string;
    if (visibility) where.visibility = visibility as string;
    if (featured === 'true') where.featured = true;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
        { category: { contains: search as string } },
      ];
    }

    const [podcasts, total] = await Promise.all([
      prisma.podcast.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.podcast.count({ where }),
    ]);

    return res.json({
      success: true,
      data: podcasts,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
}

export async function createPodcast(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
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

    const data = podcastSchema.parse(rawData);

    const isDuplicate = await checkDuplicatePodcast(data.title, data.episodeNumber, data.season);
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `Duplicate Warning: Podcast episode S${data.season}E${data.episodeNumber} or title "${data.title}" already exists.`,
      });
    }

    let slug = generateSlug(data.title);
    const existingSlug = await prisma.podcast.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-s${data.season}e${data.episodeNumber}`;
    }

    const podcast = await prisma.podcast.create({
      data: { ...data, slug },
    });

    return res.status(201).json({ success: true, message: 'Podcast published successfully', data: podcast });
  } catch (error) {
    next(error);
  }
}

export async function updatePodcast(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = req.body;

    if (data.title || data.episodeNumber || data.season) {
      const existing = await prisma.podcast.findUnique({ where: { id } });
      if (existing) {
        const title = (data.title as string) || existing.title;
        const episode = data.episodeNumber ? parseInt(data.episodeNumber, 10) : existing.episodeNumber;
        const season = data.season ? parseInt(data.season, 10) : existing.season;
        const isDup = await checkDuplicatePodcast(title, episode, season, id);
        if (isDup) {
          return res.status(400).json({
            success: false,
            message: `Duplicate Warning: Episode title or S${season}E${episode} already exists.`,
          });
        }
      }
    }

    const updated = await prisma.podcast.update({
      where: { id },
      data: {
        ...data,
        ...(data.episodeNumber && { episodeNumber: parseInt(data.episodeNumber, 10) }),
        ...(data.season && { season: parseInt(data.season, 10) }),
      },
    });

    return res.json({ success: true, message: 'Podcast updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
}

export async function incrementDownloads(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const updated = await prisma.podcast.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });
    return res.json({ success: true, data: { downloads: updated.downloads } });
  } catch (error) {
    next(error);
  }
}

export async function deletePodcast(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.podcast.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return res.json({ success: true, message: 'Podcast deleted successfully' });
  } catch (error) {
    next(error);
  }
}
