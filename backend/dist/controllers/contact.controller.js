"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContactMessage = submitContactMessage;
exports.listContactMessages = listContactMessages;
exports.updateContactMessageStatus = updateContactMessageStatus;
const prisma_1 = require("../config/prisma");
const index_1 = require("../validation/index");
/**
 * Submit contact message from public website
 * POST /api/contact
 */
async function submitContactMessage(req, res, next) {
    try {
        const data = index_1.contactMessageSchema.parse(req.body);
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const message = await prisma_1.prisma.contactMessage.create({
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * List contact messages (Admin/Staff only)
 * GET /api/contact
 */
async function listContactMessages(req, res, next) {
    try {
        const messages = await prisma_1.prisma.contactMessage.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return res.json({ success: true, data: messages });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Update contact message status (Admin/Staff only)
 * PATCH /api/contact/:id
 */
async function updateContactMessageStatus(req, res, next) {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const updated = await prisma_1.prisma.contactMessage.update({
            where: { id },
            data: { status: status || 'READ' },
        });
        return res.json({ success: true, message: 'Message status updated', data: updated });
    }
    catch (error) {
        next(error);
    }
}
