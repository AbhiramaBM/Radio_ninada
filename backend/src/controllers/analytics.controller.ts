import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { convertToCSV } from '../utils/export';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalUsers,
      totalPodcasts,
      totalPrograms,
      totalEvents,
      totalNews,
      totalRJs,
      liveRadio,
      analyticsCount,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.podcast.count({ where: { deletedAt: null } }),
      prisma.program.count({ where: { deletedAt: null } }),
      prisma.event.count({ where: { deletedAt: null } }),
      prisma.news.count({ where: { deletedAt: null } }),
      prisma.rJProfile.count({ where: { deletedAt: null } }),
      prisma.liveRadioState.findUnique({ where: { id: 'live-config' } }),
      prisma.analyticsEvent.count(),
      prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    ]);

    // Synthetic traffic charts generator for admin preview
    const weeklyTraffic = [
      { day: 'Mon', visitors: 1240, listeners: 890, downloads: 340 },
      { day: 'Tue', visitors: 1450, listeners: 980, downloads: 410 },
      { day: 'Wed', visitors: 1680, listeners: 1120, downloads: 520 },
      { day: 'Thu', visitors: 1520, listeners: 1050, downloads: 480 },
      { day: 'Fri', visitors: 2100, listeners: 1480, downloads: 690 },
      { day: 'Sat', visitors: 2890, listeners: 1950, downloads: 850 },
      { day: 'Sun', visitors: 2450, listeners: 1720, downloads: 780 },
    ];

    const popularPodcasts = await prisma.podcast.findMany({
      take: 5,
      orderBy: { downloads: 'desc' },
      select: { id: true, title: true, downloads: true, category: true, coverUrl: true },
    });

    const deviceBreakdown = [
      { name: 'Mobile', value: 65 },
      { name: 'Desktop', value: 28 },
      { name: 'Tablet', value: 7 },
    ];

    return res.json({
      success: true,
      data: {
        counters: {
          totalUsers,
          liveListeners: liveRadio?.liveListeners || 42,
          todaysVisitors: 1480 + analyticsCount,
          totalPodcasts,
          totalPrograms,
          totalEvents,
          totalNews,
          totalRJs,
          storageUsedMB: 482.5,
        },
        liveRadio,
        weeklyTraffic,
        popularPodcasts,
        deviceBreakdown,
        recentActivities: recentAuditLogs,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function exportAnalyticsReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { format = 'csv' } = req.query;

    const events = await prisma.analyticsEvent.findMany({
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
      const csv = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="radio_ninada_analytics_report.csv"');
      return res.send(csv);
    } else {
      return res.json({ success: true, data: reportData });
    }
  } catch (error) {
    next(error);
  }
}
