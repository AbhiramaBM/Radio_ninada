import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { hostSchema } from '../validation/index';
import { deleteFileFromCloudinary } from '../services/cloudinary.service';

export async function listHosts(req: Request, res: Response, next: NextFunction) {
  try {
    const hosts = await prisma.host.findMany({
      where: { deletedAt: null },
      include: {
        programs: { where: { deletedAt: null } },
        podcasts: { where: { deletedAt: null } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: hosts });
  } catch (error) {
    next(error);
  }
}

export async function getHostById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const host = await prisma.host.findFirst({
      where: { id, deletedAt: null },
      include: {
        programs: true,
        podcasts: true,
      },
    });
    if (!host) {
      return res.status(404).json({ success: false, message: 'Host not found' });
    }
    return res.json({ success: true, data: host });
  } catch (error) {
    next(error);
  }
}

export async function createHost(req: Request, res: Response, next: NextFunction) {
  try {
    const data = hostSchema.parse(req.body);
    const host = await prisma.host.create({
      data: {
        name: data.name,
        designation: data.designation,
        bio: data.bio,
        photoUrl: data.photoUrl,
        publicId: data.publicId,
        socialMedia: data.socialMedia,
        achievements: data.achievements,
        status: data.status,
      },
    });
    return res.status(201).json({ success: true, message: 'Host profile created', data: host });
  } catch (error) {
    next(error);
  }
}

export async function deleteHost(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const host = await prisma.host.findUnique({ where: { id } });
    if (!host) {
      return res.status(404).json({ success: false, message: 'Host not found' });
    }
    if (host.publicId) {
      await deleteFileFromCloudinary(host.publicId, 'image');
    }
    await prisma.host.delete({ where: { id: host.id } });
    return res.json({ success: true, message: 'Host deleted successfully' });
  } catch (error) {
    next(error);
  }
}
