"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventSchema = exports.newsSchema = exports.mediaQuerySchema = exports.contactMessageSchema = exports.announcementSchema = exports.bannerSchema = exports.liveStreamSchema = exports.episodeSchema = exports.podcastSchema = exports.programSchema = exports.hostSchema = exports.categorySchema = exports.userUpdateSchema = exports.userCreateSchema = exports.changePasswordSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// Authentication Schemas
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(6),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
// User Management Schemas
exports.userCreateSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    role: zod_1.z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ', 'USER']).default('EDITOR'),
    phone: zod_1.z.string().optional(),
    avatar: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional(),
});
exports.userUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    role: zod_1.z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ', 'USER']).optional(),
    phone: zod_1.z.string().optional(),
    avatar: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
});
// Category Schema
exports.categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Category name must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(['PODCAST', 'PROGRAM', 'NEWS', 'GENERAL']).default('GENERAL'),
});
// Host / RJ Schema
exports.hostSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Host name is required'),
    designation: zod_1.z.string().default('Radio Host / RJ'),
    bio: zod_1.z.string().min(5, 'Bio is required'),
    photoUrl: zod_1.z.string().optional(),
    publicId: zod_1.z.string().optional(),
    socialMedia: zod_1.z.string().optional(),
    achievements: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'ON_LEAVE', 'INACTIVE']).default('ACTIVE'),
});
// Program Schema
exports.programSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Program name is required'),
    description: zod_1.z.string().min(5, 'Program description is required'),
    hostId: zod_1.z.string().optional(),
    hostName: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().optional(),
    categoryName: zod_1.z.string().default('Music'),
    thumbnail: zod_1.z.string().optional(),
    thumbnailPublicId: zod_1.z.string().optional(),
    banner: zod_1.z.string().optional(),
    bannerPublicId: zod_1.z.string().optional(),
    duration: zod_1.z.string().default('60 min'),
    language: zod_1.z.string().default('Kannada'),
    tags: zod_1.z.string().default('radio,music'),
    schedule: zod_1.z.string().optional(),
    featured: zod_1.z.boolean().default(false),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});
// Podcast Schema
exports.podcastSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Podcast title is required'),
    description: zod_1.z.string().min(5, 'Podcast description is required'),
    coverUrl: zod_1.z.string().optional(),
    coverPublicId: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().optional(),
    hostId: zod_1.z.string().optional(),
    featured: zod_1.z.boolean().default(false),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});
// Podcast Episode Schema
exports.episodeSchema = zod_1.z.object({
    podcastId: zod_1.z.string().uuid('Invalid podcast ID'),
    title: zod_1.z.string().min(2, 'Episode title is required'),
    description: zod_1.z.string().min(5, 'Episode description is required'),
    episodeNumber: zod_1.z.number().int().positive().default(1),
    season: zod_1.z.number().int().positive().default(1),
    audioUrl: zod_1.z.string().url('Valid audio URL is required'),
    audioPublicId: zod_1.z.string().optional(),
    mediaId: zod_1.z.string().optional(),
    coverUrl: zod_1.z.string().optional(),
    coverPublicId: zod_1.z.string().optional(),
    duration: zod_1.z.string().default('30:00'),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});
// Live Stream State Schema
exports.liveStreamSchema = zod_1.z.object({
    isLive: zod_1.z.boolean().optional(),
    streamUrl: zod_1.z.string().url().optional(),
    title: zod_1.z.string().optional(),
    currentProgram: zod_1.z.string().optional(),
    currentHost: zod_1.z.string().optional(),
    currentSong: zod_1.z.string().optional(),
    bitrate: zod_1.z.number().int().optional(),
    quality: zod_1.z.string().optional(),
    status: zod_1.z.enum(['LIVE', 'OFFLINE', 'MAINTENANCE']).optional(),
    liveListeners: zod_1.z.number().int().optional(),
});
// Banner Schema
exports.bannerSchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    imageUrl: zod_1.z.string().url(),
    publicId: zod_1.z.string().optional(),
    targetUrl: zod_1.z.string().optional(),
    type: zod_1.z.enum(['HOMEPAGE', 'EVENT', 'SPONSOR', 'POPUP']).default('HOMEPAGE'),
    priority: zod_1.z.number().int().default(1),
    expiryDate: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'EXPIRED', 'INACTIVE']).default('ACTIVE'),
});
// Announcement Schema
exports.announcementSchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    message: zod_1.z.string().min(5),
    audience: zod_1.z.enum(['ALL', 'SUBSCRIBERS', 'RJS']).default('ALL'),
    status: zod_1.z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']).default('PUBLISHED'),
});
// Contact Message Schema
exports.contactMessageSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    phone: zod_1.z.string().optional(),
    subject: zod_1.z.string().optional(),
    message: zod_1.z.string().min(5, 'Message must be at least 5 characters'),
});
// Media Query Schema
exports.mediaQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    search: zod_1.z.string().optional(),
    folder: zod_1.z.string().optional(),
    resourceType: zod_1.z.string().optional(),
});
// News Schema
exports.newsSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    content: zod_1.z.string().min(10),
    category: zod_1.z.enum(['College', 'Local', 'State', 'National', 'International']),
    featuredImage: zod_1.z.string().optional(),
    gallery: zod_1.z.string().optional(),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('PUBLISHED'),
    publishedAt: zod_1.z.string().optional(),
});
// Event Schema
exports.eventSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string(),
    banner: zod_1.z.string().optional(),
    eventDate: zod_1.z.string(),
    location: zod_1.z.string().default('Radio Ninada Studio'),
    registrationRequired: zod_1.z.boolean().default(true),
});
