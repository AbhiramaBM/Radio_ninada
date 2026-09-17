import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { generateSlug } from '../utils/slug';
import { checkDuplicateNews } from '../utils/duplicate';
import { newsSchema } from '../validation/index';
import { deleteFileFromCloudinary, extractPublicIdFromUrl } from '../services/cloudinary.service';

export async function getNews(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, category, status, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = { deletedAt: null };
    if (category) where.category = category as string;
    if (status) where.status = status as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { content: { contains: search as string } },
      ];
    }

    const [newsItems, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.news.count({ where }),
    ]);

    return res.json({
      success: true,
      data: newsItems,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
}

export async function createNews(req: Request, res: Response, next: NextFunction) {
  try {
    let imageUrl = req.body.imageUrl;
    let publicId = req.body.publicId || req.body.cloudinaryPublicId || null;

    if (req.file) {
      imageUrl = req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://')) ? req.file.path : `/uploads/${req.file.filename}`;
      publicId = (req.file as any).public_id || extractPublicIdFromUrl(imageUrl);
    }

    if (!publicId && imageUrl) {
      publicId = extractPublicIdFromUrl(imageUrl);
    }

    const rawData = {
      ...req.body,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
    };

    const data = newsSchema.parse(rawData);

    const isDuplicate = await checkDuplicateNews(data.title);
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `Duplicate Warning: News article with headline "${data.title}" already exists.`,
      });
    }

    let slug = generateSlug(data.title);
    const existingSlug = await prisma.news.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const newsItem = await prisma.news.create({
      data: {
        ...data,
        slug,
        publicId,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
      },
    });

    return res.status(201).json({ success: true, message: 'News article created successfully', data: newsItem });
  } catch (error) {
    next(error);
  }
}

export async function updateNews(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }

    const { title, content, category, featuredImage, publicId, status, publishedAt } = req.body;

    if (title && title !== existing.title) {
      const isDup = await checkDuplicateNews(title as string, id);
      if (isDup) {
        return res.status(400).json({
          success: false,
          message: `Duplicate Warning: News article with headline "${title}" already exists.`,
        });
      }
    }

    let finalPublicId = publicId || (featuredImage ? extractPublicIdFromUrl(featuredImage) : undefined);
    if (finalPublicId && existing.publicId && existing.publicId !== finalPublicId) {
      try {
        await deleteFileFromCloudinary(existing.publicId, 'image');
      } catch (e) {
        console.warn('Old news image cleanup warning:', e);
      }
    }

    const updated = await prisma.news.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(finalPublicId !== undefined && { publicId: finalPublicId }),
        ...(status !== undefined && { status }),
        ...(publishedAt !== undefined && { publishedAt: new Date(publishedAt) }),
      },
    });

    return res.json({ success: true, message: 'News article updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteNews(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const news = await prisma.news.findUnique({ where: { id } });

    if (news) {
      const pid = news.publicId || (news.featuredImage ? extractPublicIdFromUrl(news.featuredImage) : null);
      if (pid) {
        await deleteFileFromCloudinary(pid, 'image');
      }
    }

    await prisma.news.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return res.json({ success: true, message: 'News article deleted successfully' });
  } catch (error) {
    next(error);
  }
}

