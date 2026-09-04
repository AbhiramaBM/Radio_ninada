import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { contactMessageSchema } from '../validation/index';

/**
 * Submit contact message from public website
 * POST /api/contact
 */
export async function submitContactMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = contactMessageSchema.parse(req.body);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const message = await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        ipAddress,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Your message has been received.',
      data: { id: message.id },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List contact messages (Admin/Staff only)
 * GET /api/contact
 */
export async function listContactMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
}
