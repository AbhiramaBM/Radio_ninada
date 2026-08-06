"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
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
async function createNotification(req, res, next) {
    try {
        const { title, message, audience, scheduledAt, sendImmediately } = req.body;
        const notification = await prisma_1.prisma.notification.create({
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
