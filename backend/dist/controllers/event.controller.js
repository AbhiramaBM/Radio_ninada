"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvents = getEvents;
exports.createEvent = createEvent;
exports.registerParticipant = registerParticipant;
exports.exportParticipantsCSV = exportParticipantsCSV;
exports.deleteEvent = deleteEvent;
const qrcode_1 = __importDefault(require("qrcode"));
const prisma_1 = require("../config/prisma");
const slug_1 = require("../utils/slug");
const duplicate_1 = require("../utils/duplicate");
const export_1 = require("../utils/export");
const index_1 = require("../validation/index");
async function getEvents(req, res, next) {
    try {
        const { search, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const where = { deletedAt: null };
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { location: { contains: search } },
            ];
        }
        const [events, total] = await Promise.all([
            prisma_1.prisma.event.findMany({
                where,
                include: { _count: { select: { participants: true } } },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: { eventDate: 'asc' },
            }),
            prisma_1.prisma.event.count({ where }),
        ]);
        return res.json({
            success: true,
            data: events,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    }
    catch (error) {
        next(error);
    }
}
async function createEvent(req, res, next) {
    try {
        const data = index_1.eventSchema.parse(req.body);
        const eventDate = new Date(data.eventDate);
        const isDup = await (0, duplicate_1.checkDuplicateEvent)(data.title, eventDate);
        if (isDup) {
            return res.status(400).json({
                success: false,
                message: `Duplicate Warning: An event with the title "${data.title}" is already scheduled.`,
            });
        }
        let slug = (0, slug_1.generateSlug)(data.title);
        const existingSlug = await prisma_1.prisma.event.findUnique({ where: { slug } });
        if (existingSlug) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
        const event = await prisma_1.prisma.event.create({
            data: {
                ...data,
                slug,
                eventDate,
            },
        });
        return res.status(201).json({ success: true, message: 'Event created successfully', data: event });
    }
    catch (error) {
        next(error);
    }
}
async function registerParticipant(req, res, next) {
    try {
        const eventId = req.params.eventId;
        const { name, email, phone } = req.body;
        const event = await prisma_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event || event.deletedAt) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        const registrationCode = `NINADA-EVT-${event.slug.toUpperCase()}-${Date.now().toString().slice(-6)}`;
        const qrCodeDataUrl = await qrcode_1.default.toDataURL(registrationCode);
        const participant = await prisma_1.prisma.eventParticipant.create({
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
        await prisma_1.prisma.event.update({
            where: { id: eventId },
            data: { participantsCount: { increment: 1 } },
        });
        return res.status(201).json({
            success: true,
            message: 'Event registration successful',
            data: { ...participant, registrationCode },
        });
    }
    catch (error) {
        next(error);
    }
}
async function exportParticipantsCSV(req, res, next) {
    try {
        const id = req.params.id;
        const event = await prisma_1.prisma.event.findUnique({
            where: { id },
            include: { participants: true },
        });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        const formattedData = event.participants.map((p) => ({
            ID: p.id,
            Name: p.name,
            Email: p.email,
            Phone: p.phone,
            Attendance: p.attendance,
            Status: p.status,
            RegisteredAt: p.createdAt.toISOString(),
        }));
        const csvStr = (0, export_1.convertToCSV)(formattedData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="event_${event.slug}_participants.csv"`);
        return res.send(csvStr);
    }
    catch (error) {
        next(error);
    }
}
async function deleteEvent(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.event.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return res.json({ success: true, message: 'Event deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
