import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, message, audience, scheduledAt, sendImmediately } = req.body;

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        audience: audience || 'ALL',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        sentAt: sendImmediately ? new Date() : null,
        status: sendImmediately ? 'SENT' : scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    return res.status(201).json({
      success: true,
      message: sendImmediately ? 'Push notification broadcasted!' : 'Notification saved successfully',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.notification.delete({ where: { id } });
    return res.json({ success: true, message: 'Notification removed' });
  } catch (error) {
    next(error);
  }
}
