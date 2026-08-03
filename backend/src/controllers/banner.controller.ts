import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export async function getBanners(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, status } = req.query;
    const where: any = {};
    if (type) where.type = type as string;
    if (status) where.status = status as string;

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { priority: 'asc' },
    });
    return res.json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
}

export async function createBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    let imageUrl = req.body.imageUrl;
    if (file) {
      imageUrl = `/uploads/${file.filename}`;
    }

    const { title, targetUrl, type, priority, expiryDate, status } = req.body;

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        targetUrl,
        type: type || 'HOMEPAGE',
        priority: priority ? parseInt(priority, 10) : 1,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: status || 'ACTIVE',
      },
    });

    return res.status(201).json({ success: true, message: 'Banner added successfully', data: banner });
  } catch (error) {
    next(error);
  }
}

export async function deleteBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.banner.delete({ where: { id } });
    return res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    next(error);
  }
}
