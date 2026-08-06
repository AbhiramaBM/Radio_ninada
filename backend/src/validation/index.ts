import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const firebaseLoginSchema = z.object({
  idToken: z.string().min(10, 'Firebase ID token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

export const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  type: z.enum(['VERIFICATION', 'FORGOT_PASSWORD', 'LOGIN']).default('VERIFICATION'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
  type: z.enum(['VERIFICATION', 'FORGOT_PASSWORD', 'LOGIN']).default('VERIFICATION'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ', 'MODERATOR']),
  avatar: z.string().optional(),
  bio: z.string().optional(),
});

export const programSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  hostId: z.string().optional(),
  hostName: z.string().optional(),
  category: z.string().default('Music'),
  thumbnail: z.string().optional(),
  banner: z.string().optional(),
  duration: z.string().default('60 min'),
  language: z.string().default('Kannada'),
  tags: z.string().default('radio,music'),
  schedule: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});

export const podcastSchema = z.object({
  title: z.string().min(2),
  audioUrl: z.string(),
  coverUrl: z.string().optional(),
  category: z.string().default('Talk Show'),
  episodeNumber: z.number().int().positive().default(1),
  season: z.number().int().positive().default(1),
  description: z.string(),
  duration: z.string().default('30:00'),
  featured: z.boolean().default(false),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'DRAFT']).default('PUBLIC'),
});

export const newsSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  category: z.enum(['College', 'Local', 'State', 'National', 'International']),
  featuredImage: z.string().optional(),
  gallery: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('PUBLISHED'),
  publishedAt: z.string().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  banner: z.string().optional(),
  eventDate: z.string(),
  location: z.string().default('Radio Ninada Studio'),
  registrationRequired: z.boolean().default(true),
});
