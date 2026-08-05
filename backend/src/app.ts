import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config/index';
import { errorHandler } from './middlewares/error';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import liveRoutes from './routes/live.routes';
import programRoutes from './routes/program.routes';
import podcastRoutes from './routes/podcast.routes';
import scheduleRoutes from './routes/schedule.routes';
import newsRoutes from './routes/news.routes';
import rjRoutes from './routes/rj.routes';
import eventRoutes from './routes/event.routes';
import galleryRoutes from './routes/gallery.routes';
import notificationRoutes from './routes/notification.routes';
import bannerRoutes from './routes/banner.routes';
import sponsorRoutes from './routes/sponsor.routes';
import analyticsRoutes from './routes/analytics.routes';
import aiRoutes from './routes/ai.routes';
import uploadRoutes from './routes/upload.routes';

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
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads serving
app.use('/uploads', express.static(config.uploadDir));

// Static Public Frontend Serving
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'Radio Ninada REST API Server',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mapping
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/podcasts', podcastRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/rj', rjRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

// Root route serves the Public Website
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'modern_fm_home.html'));
});

// Error Handler
app.use(errorHandler);

export default app;
