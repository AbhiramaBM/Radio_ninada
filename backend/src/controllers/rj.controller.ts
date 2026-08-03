import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export async function getRJs(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, status } = req.query;
    const where: any = { deletedAt: null };
    if (status) where.status = status as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { designation: { contains: search as string } },
        { bio: { contains: search as string } },
      ];
    }

    const rjs = await prisma.rJProfile.findMany({
      where,
      orderBy: { followers: 'desc' },
    });

    return res.json({ success: true, data: rjs });
  } catch (error) {
    next(error);
  }
}

export async function createRJ(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, photo, designation, bio, socialMedia, achievements, status } = req.body;

    const rj = await prisma.rJProfile.create({
      data: {
        name,
        photo: photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        designation: designation || 'RJ / Host',
        bio: bio || 'Radio Ninada Presenter',
        socialMedia: typeof socialMedia === 'object' ? JSON.stringify(socialMedia) : socialMedia,
        achievements,
        status: status || 'ACTIVE',
      },
    });

    return res.status(201).json({ success: true, message: 'RJ Profile created successfully', data: rj });
  } catch (error) {
    next(error);
  }
}

export async function updateRJ(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const updated = await prisma.rJProfile.update({
      where: { id },
      data: {
        ...data,
        ...(data.socialMedia && typeof data.socialMedia === 'object' && { socialMedia: JSON.stringify(data.socialMedia) }),
      },
    });

    return res.json({ success: true, message: 'RJ Profile updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteRJ(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.rJProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return res.json({ success: true, message: 'RJ Profile deleted successfully' });
  } catch (error) {
    next(error);
  }
}
