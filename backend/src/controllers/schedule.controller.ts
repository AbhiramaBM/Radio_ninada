import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export async function getSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const { dayOfWeek } = req.query;
    const where: any = { deletedAt: null };
    if (dayOfWeek !== undefined) {
      where.dayOfWeek = parseInt(dayOfWeek as string, 10);
    }

    const schedule = await prisma.schedule.findMany({
      where,
      include: {
        program: {
          select: { id: true, name: true, category: true, thumbnail: true, hostName: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
}

export async function createScheduleSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const { programId, dayOfWeek, startTime, endTime, isRecurring, isSpecial, holidayName } = req.body;

    const day = parseInt(dayOfWeek, 10);

    // Conflict detection engine
    const conflicts = await prisma.schedule.findMany({
      where: {
        dayOfWeek: day,
        deletedAt: null,
        OR: [
          { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
          { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
          { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] },
        ],
      },
      include: { program: { select: { name: true } } },
    });

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Schedule Conflict Detected! Slot overlaps with existing program "${conflicts[0].program.name}" (${conflicts[0].startTime} - ${conflicts[0].endTime}).`,
        data: { conflicts },
      });
    }

    const slot = await prisma.schedule.create({
      data: {
        programId,
        dayOfWeek: day,
        startTime,
        endTime,
        isRecurring: isRecurring ?? true,
        isSpecial: isSpecial ?? false,
        holidayName,
      },
      include: { program: true },
    });

    return res.status(201).json({ success: true, message: 'Schedule slot added successfully', data: slot });
  } catch (error) {
    next(error);
  }
}

export async function batchUpdateSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    for (const item of items) {
      await prisma.schedule.update({
        where: { id: item.id },
        data: {
          dayOfWeek: parseInt(item.dayOfWeek, 10),
          startTime: item.startTime,
          endTime: item.endTime,
        },
      });
    }

    return res.json({ success: true, message: 'Schedule updated successfully via drag and drop planner' });
  } catch (error) {
    next(error);
  }
}

export async function deleteScheduleSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.schedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return res.json({ success: true, message: 'Schedule slot removed successfully' });
  } catch (error) {
    next(error);
  }
}
