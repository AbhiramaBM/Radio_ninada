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

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return res.json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}

export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, message, audience, targetAudience, scheduledAt, sendImmediately, status } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const isImmediate = sendImmediately !== undefined ? sendImmediately : status === 'SENT' || !scheduledAt;

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        audience: audience || targetAudience || 'ALL',
        isRead: false,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        sentAt: isImmediate ? new Date() : null,
        status: isImmediate ? 'SENT' : scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    return res.status(201).json({
      success: true,
      message: isImmediate ? 'Push notification broadcasted!' : 'Notification saved successfully',
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
