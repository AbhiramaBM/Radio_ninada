import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { generateSlug } from '../utils/slug';
import { checkDuplicateProgram } from '../utils/duplicate';
import { programSchema } from '../validation/index';
import { deleteFileFromCloudinary } from '../services/cloudinary.service';

export async function getPrograms(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, category, featured, page = '1', limit = '12' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = { deletedAt: null };
    if (category && category !== 'ALL') {
      where.OR = [
        { category: { slug: category as string } },
        { category: { name: category as string } },
        { categoryName: { contains: category as string, mode: 'insensitive' } },
      ];
    }
    if (featured === 'true') where.featured = true;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { hostName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where,
        include: {
          host: true,
          category: true,
          schedules: true,
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.program.count({ where }),
    ]);

    return res.json({
      success: true,
      data: programs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProgramBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;
    const program = await prisma.program.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        deletedAt: null,
      },
      include: {
        host: true,
        category: true,
        schedules: true,
      },
    });

    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    return res.json({ success: true, data: program });
  } catch (error) {
    next(error);
  }
}

export async function createProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const data = programSchema.parse(req.body);

    const isDuplicate = await checkDuplicateProgram(data.name);
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `A program with the name "${data.name}" already exists.`,
      });
    }

    let slug = generateSlug(data.name);
    const existing = await prisma.program.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const program = await prisma.program.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        hostId: data.hostId,
        hostName: data.hostName || 'Radio Ninada RJ',
        categoryId: data.categoryId,
        categoryName: data.categoryName || 'Music',
        thumbnail: data.thumbnail,
        thumbnailPublicId: data.thumbnailPublicId,
        banner: data.banner,
        bannerPublicId: data.bannerPublicId,
        duration: data.duration,
        language: data.language,
        tags: data.tags,
        schedule: data.schedule || 'Daily Broadcast',
        featured: data.featured,
        status: data.status,
      },
      include: {
        host: true,
        category: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Program created successfully',
      data: program,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const program = await prisma.program.findUnique({
      where: { id },
    });

    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    if (program.thumbnailPublicId) {
      await deleteFileFromCloudinary(program.thumbnailPublicId, 'image');
    }
    if (program.bannerPublicId) {
      await deleteFileFromCloudinary(program.bannerPublicId, 'image');
    }

    await prisma.program.delete({
      where: { id: program.id },
    });

    return res.json({ success: true, message: 'Program deleted successfully' });
  } catch (error) {
    next(error);
  }
}
