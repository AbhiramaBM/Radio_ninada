import { z } from 'zod';

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// User Management Schemas
export const userCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ', 'USER']).default('EDITOR'),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ', 'USER']).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
});

// Category Schema
export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['PODCAST', 'PROGRAM', 'NEWS', 'GENERAL']).default('GENERAL'),
});

// Host / RJ Schema
export const hostSchema = z.object({
  name: z.string().min(2, 'Host name is required'),
  designation: z.string().default('Radio Host / RJ'),
  bio: z.string().min(5, 'Bio is required'),
  photoUrl: z.string().optional(),
  publicId: z.string().optional(),
  socialMedia: z.string().optional(),
  achievements: z.string().optional(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'INACTIVE']).default('ACTIVE'),
});

// Program Schema
export const programSchema = z.object({
  name: z.string().min(2, 'Program name is required'),
  description: z.string().min(5, 'Program description is required'),
  hostId: z.string().optional(),
  hostName: z.string().optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().default('Music'),
  thumbnail: z.string().optional(),
  thumbnailPublicId: z.string().optional(),
  banner: z.string().optional(),
  bannerPublicId: z.string().optional(),
  duration: z.string().default('60 min'),
  language: z.string().default('Kannada'),
  tags: z.string().default('radio,music'),
  schedule: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});

// Podcast Schema
export const podcastSchema = z.object({
  title: z.string().min(2, 'Podcast title is required'),
  description: z.string().min(5, 'Podcast description is required'),
  coverUrl: z.string().optional(),
  coverPublicId: z.string().optional(),
  audioUrl: z.string().optional(),
  audioPublicId: z.string().optional(),
  duration: z.string().optional(),
  categoryId: z.string().optional(),
  hostId: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});

// Podcast Episode Schema
export const episodeSchema = z.object({
  podcastId: z.string().uuid('Invalid podcast ID'),
  title: z.string().min(2, 'Episode title is required'),
  description: z.string().min(5, 'Episode description is required'),
  episodeNumber: z.number().int().positive().default(1),
  season: z.number().int().positive().default(1),
  audioUrl: z.string().url('Valid audio URL is required'),
  audioPublicId: z.string().optional(),
  mediaId: z.string().optional(),
  coverUrl: z.string().optional(),
  coverPublicId: z.string().optional(),
  duration: z.string().default('30:00'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});

// Live Stream State Schema
export const liveStreamSchema = z.object({
  isLive: z.boolean().optional(),
  streamUrl: z.string().url().optional(),
  title: z.string().optional(),
  currentProgram: z.string().optional(),
  currentHost: z.string().optional(),
  currentSong: z.string().optional(),
  bitrate: z.number().int().optional(),
  quality: z.string().optional(),
  status: z.enum(['LIVE', 'OFFLINE', 'MAINTENANCE']).optional(),
  liveListeners: z.number().int().optional(),
});

// Banner Schema
export const bannerSchema = z.object({
  title: z.string().min(2),
  imageUrl: z.string().url(),
  publicId: z.string().optional(),
  targetUrl: z.string().optional(),
  type: z.enum(['HOMEPAGE', 'EVENT', 'SPONSOR', 'POPUP']).default('HOMEPAGE'),
  priority: z.number().int().default(1),
  expiryDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'INACTIVE']).default('ACTIVE'),
});

// Announcement Schema
export const announcementSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(5),
  audience: z.enum(['ALL', 'SUBSCRIBERS', 'RJS']).default('ALL'),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']).default('PUBLISHED'),
});

// Contact Message Schema
export const contactMessageSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

// Media Query Schema
export const mediaQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  folder: z.string().optional(),
  resourceType: z.string().optional(),
});

// News Schema
export const newsSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  category: z.enum(['College', 'Local', 'State', 'National', 'International']),
  featuredImage: z.string().optional(),
  gallery: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('PUBLISHED'),
  publishedAt: z.string().optional(),
});

// Event Schema
export const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  banner: z.string().optional(),
  eventDate: z.string(),
  location: z.string().default('Radio Ninada Studio'),
  registrationRequired: z.boolean().default(true),
});

