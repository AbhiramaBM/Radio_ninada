import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { announcementSchema } from '../validation/index';

export async function getAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const data = announcementSchema.parse(req.body);
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        message: data.message,
        audience: data.audience,
        status: data.status,
      },
    });
    return res.status(201).json({ success: true, message: 'Announcement created', data: announcement });
  } catch (error) {
    next(error);
  }
}

export async function markAnnouncementRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const updated = await prisma.announcement.update({
      where: { id },
      data: { isRead: true },
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.announcement.delete({
      where: { id },
    });
    return res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
}
