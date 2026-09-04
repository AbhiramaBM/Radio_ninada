import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { config } from './config/index';
import { errorHandler } from './middlewares/error';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import liveRoutes from './routes/live.routes';
import programRoutes from './routes/program.routes';
import podcastRoutes from './routes/podcast.routes';
import categoryRoutes from './routes/category.routes';
import hostRoutes from './routes/host.routes';
import rjRoutes from './routes/rj.routes';
import mediaRoutes from './routes/media.routes';
import contactRoutes from './routes/contact.routes';
import bannerRoutes from './routes/banner.routes';
import announcementRoutes from './routes/announcement.routes';
import notificationRoutes from './routes/notification.routes';
import scheduleRoutes from './routes/schedule.routes';
import newsRoutes from './routes/news.routes';
import eventRoutes from './routes/event.routes';
import galleryRoutes from './routes/gallery.routes';
import playlistRoutes from './routes/playlist.routes';
import sponsorRoutes from './routes/sponsor.routes';
import analyticsRoutes from './routes/analytics.routes';
import aiRoutes from './routes/ai.routes';

const app = express();

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));

// Rate Limiter (Max 300 requests per 15 mins)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Logging & Parsing
app.use(morgan('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static uploads serving (temporary local directory)
app.use('/uploads', express.static(config.uploadDir));

// Static Public Frontend Serving (detects local dev, compiled dist, Docker, or custom FRONTEND_DIR)
const resolveFrontendPath = (): string => {
  if (process.env.FRONTEND_DIR && fs.existsSync(process.env.FRONTEND_DIR)) {
    return process.env.FRONTEND_DIR;
  }
  const potentialPaths = [
    path.resolve(__dirname, '../../frontend'),
    path.resolve(__dirname, '../frontend'),
    path.resolve(__dirname, './frontend'),
    path.resolve(process.cwd(), 'frontend'),
    path.resolve(process.cwd(), '../frontend'),
  ];
  for (const candidate of potentialPaths) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }
  return path.resolve(process.cwd(), 'frontend');
};

const frontendPath = resolveFrontendPath();
app.use(express.static(frontendPath));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'UP',
    service: 'Radio Ninada REST API Server',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString(),
  });
});

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/podcasts', podcastRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/hosts', hostRoutes);
app.use('/api/rj', rjRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/upload', mediaRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Public Website Route
app.get(['/', '/index.html'], (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Admin Dashboard Route
app.get(['/admin', '/admin.html'], (_req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

// Fallback: Serve static assets if they exist, else index.html (excluding /api routes)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const potentialFile = path.join(frontendPath, req.path);
  if (fs.existsSync(potentialFile) && fs.statSync(potentialFile).isFile()) {
    return res.sendFile(potentialFile);
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
