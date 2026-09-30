import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { announcementSchema } from '../validation/index';

export async function getAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    let announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (announcements.length === 0) {
      await prisma.announcement.createMany({
        data: [
          {
            title: 'Welcome to Radio Ninada 90.4 FM',
            message: 'Broadcasting live from SDM College Ujire. Enjoy curated shows, campus buzz, and regional music.',
            audience: 'ALL',
            status: 'PUBLISHED',
          },
          {
            title: 'Yakshagana & Cultural Showcase Tonight',
            message: 'Tune in at 8:00 PM for a special heritage performance hosted by RJ Vikram.',
            audience: 'ALL',
            status: 'PUBLISHED',
          },
          {
            title: 'Campus Buzz & Youth Beat Episode 14',
            message: 'A brand-new student feature episode is now available on demand in Podcasts.',
            audience: 'ALL',
            status: 'PUBLISHED',
          },
        ],
      });
      announcements = await prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }

    return res.json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
}

export async function markAllAnnouncementsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.announcement.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ success: true, message: 'All announcements marked as read', data: announcements });
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

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const { title, message, audience, status } = req.body;

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(message !== undefined && { message }),
        ...(audience !== undefined && { audience }),
        ...(status !== undefined && { status }),
      },
    });

    return res.json({ success: true, message: 'Announcement updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
}
