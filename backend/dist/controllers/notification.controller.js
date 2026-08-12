"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.createNotification = createNotification;
exports.deleteNotification = deleteNotification;
const prisma_1 = require("../config/prisma");
async function getNotifications(req, res, next) {
    try {
        const notifications = await prisma_1.prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: notifications });
    }
    catch (error) {
        next(error);
    }
}
async function markAsRead(req, res, next) {
    try {
        const id = req.params.id;
        const notification = await prisma_1.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
        return res.json({ success: true, message: 'Notification marked as read', data: notification });
    }
    catch (error) {
        next(error);
    }
}
async function markAllAsRead(req, res, next) {
    try {
        await prisma_1.prisma.notification.updateMany({
            where: { isRead: false },
            data: { isRead: true },
        });
        return res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        next(error);
    }
}
async function createNotification(req, res, next) {
    try {
        const { title, message, audience, targetAudience, scheduledAt, sendImmediately, status } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }
        const isImmediate = sendImmediately !== undefined ? sendImmediately : status === 'SENT' || !scheduledAt;
        const notification = await prisma_1.prisma.notification.create({
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
    }
    catch (error) {
        next(error);
    }
}
async function deleteNotification(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.notification.delete({ where: { id } });
        return res.json({ success: true, message: 'Notification removed' });
    }
    catch (error) {
        next(error);
    }
}
