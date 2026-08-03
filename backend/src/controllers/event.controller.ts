import { Request, Response, NextFunction } from 'express';
import QRCode from 'qrcode';
import { prisma } from '../config/prisma';
import { generateSlug } from '../utils/slug';
import { checkDuplicateEvent } from '../utils/duplicate';
import { convertToCSV } from '../utils/export';
import { eventSchema } from '../validation/index';

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
        { location: { contains: search as string } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: { _count: { select: { participants: true } } },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { eventDate: 'asc' },
      }),
      prisma.event.count({ where }),
    ]);

    return res.json({
      success: true,
      data: events,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = eventSchema.parse(req.body);

    const eventDate = new Date(data.eventDate);
    const isDup = await checkDuplicateEvent(data.title, eventDate);
    if (isDup) {
      return res.status(400).json({
        success: false,
        message: `Duplicate Warning: An event with the title "${data.title}" is already scheduled.`,
      });
    }

    let slug = generateSlug(data.title);
    const existingSlug = await prisma.event.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const event = await prisma.event.create({
      data: {
        ...data,
        slug,
        eventDate,
      },
    });

    return res.status(201).json({ success: true, message: 'Event created successfully', data: event });
  } catch (error) {
    next(error);
  }
}

export async function registerParticipant(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.eventId as string;
    const { name, email, phone } = req.body;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.deletedAt) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const registrationCode = `NINADA-EVT-${event.slug.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(registrationCode);

    const participant = await prisma.eventParticipant.create({
      data: {
        eventId,
        name,
        email,
        phone,
        qrCode: qrCodeDataUrl,
        attendance: 'REGISTERED',
        status: 'APPROVED',
      },
    });

    await prisma.event.update({
      where: { id: eventId },
      data: { participantsCount: { increment: 1 } },
    });

    return res.status(201).json({
      success: true,
      message: 'Event registration successful',
      data: { ...participant, registrationCode },
    });
  } catch (error) {
    next(error);
  }
}

export async function exportParticipantsCSV(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const event = await prisma.event.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const formattedData = event.participants.map((p: any) => ({
      ID: p.id,
      Name: p.name,
      Email: p.email,
      Phone: p.phone,
      Attendance: p.attendance,
      Status: p.status,
      RegisteredAt: p.createdAt.toISOString(),
    }));

    const csvStr = convertToCSV(formattedData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="event_${event.slug}_participants.csv"`);
    return res.send(csvStr);
  } catch (error) {
    next(error);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
}
