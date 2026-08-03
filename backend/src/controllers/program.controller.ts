import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { generateSlug } from '../utils/slug';
import { checkDuplicateProgram } from '../utils/duplicate';
import { programSchema } from '../validation/index';

export async function getPrograms(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, category, status, featured, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = { deletedAt: null };
    if (category) where.category = category as string;
    if (status) where.status = status as string;
    if (featured === 'true') where.featured = true;
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
        { hostName: { contains: search as string } },
        { tags: { contains: search as string } },
      ];
    }

    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.program.count({ where }),
    ]);

    return res.json({
      success: true,
      data: programs,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
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
        message: `Duplicate Warning: A program with the name "${data.name}" already exists.`,
      });
    }

    let slug = generateSlug(data.name);
    const existingSlug = await prisma.program.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const program = await prisma.program.create({
      data: { ...data, slug },
    });

    return res.status(201).json({ success: true, message: 'Program created successfully', data: program });
  } catch (error) {
    next(error);
  }
}

export async function updateProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = req.body;

    if (data.name) {
      const isDuplicate = await checkDuplicateProgram(data.name as string, id);
      if (isDuplicate) {
        return res.status(400).json({
          success: false,
          message: `Duplicate Warning: A program with the name "${data.name}" already exists.`,
        });
      }
    }

    const updated = await prisma.program.update({
      where: { id },
      data,
    });

    return res.json({ success: true, message: 'Program updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.program.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return res.json({ success: true, message: 'Program deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function bulkDeletePrograms(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: 'Array of program IDs required' });
    }
    await prisma.program.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
    return res.json({ success: true, message: `${ids.length} programs deleted successfully` });
  } catch (error) {
    next(error);
  }
}

export async function bulkPublishPrograms(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: 'Array of program IDs required' });
    }
    await prisma.program.updateMany({
      where: { id: { in: ids } },
      data: { status: 'PUBLISHED' },
    });
    return res.json({ success: true, message: `${ids.length} programs published successfully` });
  } catch (error) {
    next(error);
  }
}
