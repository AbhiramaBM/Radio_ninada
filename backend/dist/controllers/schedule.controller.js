"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchedule = getSchedule;
exports.createScheduleSlot = createScheduleSlot;
exports.batchUpdateSchedule = batchUpdateSchedule;
exports.deleteScheduleSlot = deleteScheduleSlot;
const prisma_1 = require("../config/prisma");
async function getSchedule(req, res, next) {
    try {
        const { dayOfWeek } = req.query;
        const where = { deletedAt: null };
        if (dayOfWeek !== undefined) {
            where.dayOfWeek = parseInt(dayOfWeek, 10);
        }
        const schedule = await prisma_1.prisma.schedule.findMany({
            where,
            include: {
                program: {
                    select: { id: true, name: true, category: true, thumbnail: true, hostName: true },
                },
            },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
        return res.json({ success: true, data: schedule });
    }
    catch (error) {
        next(error);
    }
}
async function createScheduleSlot(req, res, next) {
    try {
        const { programId, dayOfWeek, startTime, endTime, isRecurring, isSpecial, holidayName } = req.body;
        const day = parseInt(dayOfWeek, 10);
        // Conflict detection engine
        const conflicts = await prisma_1.prisma.schedule.findMany({
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
        const slot = await prisma_1.prisma.schedule.create({
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
    }
    catch (error) {
        next(error);
    }
}
async function batchUpdateSchedule(req, res, next) {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Items array is required' });
        }
        for (const item of items) {
            await prisma_1.prisma.schedule.update({
                where: { id: item.id },
                data: {
                    dayOfWeek: parseInt(item.dayOfWeek, 10),
                    startTime: item.startTime,
                    endTime: item.endTime,
                },
            });
        }
        return res.json({ success: true, message: 'Schedule updated successfully via drag and drop planner' });
    }
    catch (error) {
        next(error);
    }
}
async function deleteScheduleSlot(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.schedule.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return res.json({ success: true, message: 'Schedule slot removed successfully' });
    }
    catch (error) {
        next(error);
    }
}
