"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
exports.exportAnalyticsReport = exportAnalyticsReport;
const prisma_1 = require("../config/prisma");
const export_1 = require("../utils/export");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getUploadsFolderSizeMB() {
    try {
        const uploadsPath = path_1.default.join(__dirname, '../../uploads');
        if (!fs_1.default.existsSync(uploadsPath))
            return 0;
        let totalSize = 0;
        const files = fs_1.default.readdirSync(uploadsPath);
        for (const file of files) {
            const stats = fs_1.default.statSync(path_1.default.join(uploadsPath, file));
            totalSize += stats.size;
        }
        return Math.round((totalSize / (1024 * 1024)) * 100) / 100;
    }
    catch {
        return 0;
    }
}
async function getDashboardStats(req, res, next) {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const [totalUsers, totalPodcasts, totalPrograms, totalEvents, totalNews, totalRJs, liveRadio, todaysVisitors, recentAuditLogs, recentEvents, deviceGroup,] = await Promise.all([
            prisma_1.prisma.user.count({ where: { deletedAt: null } }),
            prisma_1.prisma.podcast.count({ where: { deletedAt: null } }),
            prisma_1.prisma.program.count({ where: { deletedAt: null } }),
            prisma_1.prisma.event.count({ where: { deletedAt: null } }),
            prisma_1.prisma.news.count({ where: { deletedAt: null } }),
            prisma_1.prisma.rJProfile.count({ where: { deletedAt: null } }),
            prisma_1.prisma.liveStream.findUnique({ where: { id: 'live-config' } }),
            prisma_1.prisma.analyticsEvent.count({ where: { timestamp: { gte: startOfToday } } }),
            prisma_1.prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
            prisma_1.prisma.analyticsEvent.findMany({ where: { timestamp: { gte: sevenDaysAgo } } }),
            prisma_1.prisma.analyticsEvent.groupBy({ by: ['device'], _count: { device: true } }),
        ]);
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                day: daysOfWeek[d.getDay()],
                dateStr: d.toISOString().split('T')[0],
                visitors: 0,
                listeners: 0,
                downloads: 0,
            };
        });
        recentEvents.forEach((evt) => {
            const dateStr = evt.timestamp.toISOString().split('T')[0];
            const dayObj = last7Days.find((d) => d.dateStr === dateStr);
            if (dayObj) {
                if (evt.eventType === 'PAGE_VIEW')
                    dayObj.visitors += 1;
                if (evt.eventType === 'LIVE_LISTEN')
                    dayObj.listeners += 1;
                if (evt.eventType === 'PODCAST_LISTEN')
                    dayObj.downloads += 1;
            }
        });
        const weeklyTraffic = last7Days.map(({ day, visitors, listeners, downloads }) => ({
            day,
            visitors,
            listeners,
            downloads,
        }));
        const totalDeviceEvents = deviceGroup.reduce((acc, curr) => acc + (curr._count?.device || 0), 0);
        const deviceBreakdown = totalDeviceEvents > 0
            ? deviceGroup.map((item) => ({
                name: item.device || 'Unknown',
                value: Math.round(((item._count?.device || 0) / totalDeviceEvents) * 100),
            }))
            : [
                { name: 'Mobile', value: 0 },
                { name: 'Desktop', value: 0 },
                { name: 'Tablet', value: 0 },
            ];
        const popularPodcasts = await prisma_1.prisma.podcast.findMany({
            take: 5,
            orderBy: { downloads: 'desc' },
            select: { id: true, title: true, downloads: true, category: true, coverUrl: true },
        });
        return res.json({
            success: true,
            data: {
                counters: {
                    totalUsers,
                    liveListeners: liveRadio?.isLive ? (liveRadio?.liveListeners || 0) : 0,
                    todaysVisitors,
                    totalPodcasts,
                    totalPrograms,
                    totalEvents,
                    totalNews,
                    totalRJs,
                    storageUsedMB: getUploadsFolderSizeMB(),
                },
                liveRadio,
                weeklyTraffic,
                popularPodcasts,
                deviceBreakdown,
                recentActivities: recentAuditLogs,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
async function exportAnalyticsReport(req, res, next) {
    try {
        const { format = 'csv' } = req.query;
        const events = await prisma_1.prisma.analyticsEvent.findMany({
            take: 500,
            orderBy: { timestamp: 'desc' },
        });
        const reportData = events.map((e) => ({
            ID: e.id,
            EventType: e.eventType,
            Path: e.path || '/',
            IP: e.ip || '127.0.0.1',
            Country: e.country || 'India',
            Device: e.device || 'Mobile',
            Browser: e.browser || 'Chrome',
            Timestamp: e.timestamp.toISOString(),
        }));
        if (format === 'csv') {
            const csv = (0, export_1.convertToCSV)(reportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="radio_ninada_analytics_report.csv"');
            return res.send(csv);
        }
        else {
            return res.json({ success: true, data: reportData });
        }
    }
    catch (error) {
        next(error);
    }
}
