import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export async function getGallery(req: Request, res: Response, next: NextFunction) {
  try {
    const { album, type, category } = req.query;
    const where: any = { deletedAt: null };
    if (album) where.album = album as string;
    if (type) where.type = type as string;
    if (category) where.category = category as string;

    const items = await prisma.galleryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
}

export async function createGalleryItem(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    let mediaUrl = req.body.mediaUrl;
    if (file) {
      mediaUrl = `/uploads/${file.filename}`;
    }

    const { title, type, album, category } = req.body;
    const item = await prisma.galleryItem.create({
      data: {
        title: title || 'Gallery Image',
        type: type || 'PHOTO',
        mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
        album: album || 'General',
        category: category || 'Events',
      },
    });

    return res.status(201).json({ success: true, message: 'Gallery item uploaded successfully', data: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteGalleryItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.galleryItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (error) {
    next(error);
  }
}
