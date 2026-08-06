"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventSchema = exports.newsSchema = exports.podcastSchema = exports.programSchema = exports.userCreateSchema = exports.resetPasswordSchema = exports.verifyOtpSchema = exports.sendOtpSchema = exports.signupSchema = exports.changePasswordSchema = exports.firebaseLoginSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.firebaseLoginSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(10, 'Firebase ID token is required'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(6),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
exports.signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    phone: zod_1.z.string().optional(),
});
exports.sendOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    type: zod_1.z.enum(['VERIFICATION', 'FORGOT_PASSWORD', 'LOGIN']).default('VERIFICATION'),
});
exports.verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    code: zod_1.z.string().length(6, 'OTP must be exactly 6 digits'),
    type: zod_1.z.enum(['VERIFICATION', 'FORGOT_PASSWORD', 'LOGIN']).default('VERIFICATION'),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    code: zod_1.z.string().length(6, 'OTP must be exactly 6 digits'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
exports.userCreateSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ', 'MODERATOR']),
    avatar: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional(),
});
exports.programSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().min(5),
    hostId: zod_1.z.string().optional(),
    hostName: zod_1.z.string().optional(),
    category: zod_1.z.string().default('Music'),
    thumbnail: zod_1.z.string().optional(),
    banner: zod_1.z.string().optional(),
    duration: zod_1.z.string().default('60 min'),
    language: zod_1.z.string().default('Kannada'),
    tags: zod_1.z.string().default('radio,music'),
    schedule: zod_1.z.string().optional(),
    featured: zod_1.z.boolean().default(false),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});
exports.podcastSchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    audioUrl: zod_1.z.string(),
    coverUrl: zod_1.z.string().optional(),
    category: zod_1.z.string().default('Talk Show'),
    episodeNumber: zod_1.z.number().int().positive().default(1),
    season: zod_1.z.number().int().positive().default(1),
    description: zod_1.z.string(),
    duration: zod_1.z.string().default('30:00'),
    featured: zod_1.z.boolean().default(false),
    visibility: zod_1.z.enum(['PUBLIC', 'PRIVATE', 'DRAFT']).default('PUBLIC'),
});
exports.newsSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    content: zod_1.z.string().min(10),
    category: zod_1.z.enum(['College', 'Local', 'State', 'National', 'International']),
    featuredImage: zod_1.z.string().optional(),
    gallery: zod_1.z.string().optional(),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('PUBLISHED'),
    publishedAt: zod_1.z.string().optional(),
});
exports.eventSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string(),
    banner: zod_1.z.string().optional(),
    eventDate: zod_1.z.string(),
    location: zod_1.z.string().default('Radio Ninada Studio'),
    registrationRequired: zod_1.z.boolean().default(true),
});
