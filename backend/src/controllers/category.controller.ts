import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { categorySchema } from '../validation/index';
import { generateSlug } from '../utils/slug';

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = categorySchema.parse(req.body);
    const slug = generateSlug(data.name);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        type: data.type,
      },
    });

    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.category.delete({
      where: { id },
    });
    return res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
}
