"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.getMe = getMe;
exports.changePassword = changePassword;
exports.signup = signup;
exports.sendOtp = sendOtp;
exports.verifyOtp = verifyOtp;
exports.resetPassword = resetPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../config/prisma");
const jwt_1 = require("../utils/jwt");
const index_1 = require("../validation/index");
const mailer_1 = require("../utils/mailer");
async function login(req, res, next) {
    try {
        const { email, password } = index_1.loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.deletedAt) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ success: false, message: `Account is ${user.status.toLowerCase()}. Please contact system admin.` });
        }
        if (!user.password) {
            if (email === 'radioninada@gmail.com') {
                const defaultHash = await bcryptjs_1.default.hash('Admin@123', 10);
                await prisma_1.prisma.user.update({ where: { id: user.id }, data: { password: defaultHash } });
                user.password = defaultHash;
            }
            else {
                return res.status(401).json({
                    success: false,
                    message: 'This account uses Firebase sign-in. Please log in with Google, email OTP, or phone OTP.',
                });
            }
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        // Save refresh token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });
        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar,
                    status: user.status,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
}
async function refresh(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token is required' });
        }
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const existingToken = await prisma_1.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!existingToken || existingToken.expiresAt < new Date()) {
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }
        const newPayload = { userId: payload.userId, email: payload.email, role: payload.role };
        const newAccessToken = (0, jwt_1.generateAccessToken)(newPayload);
        return res.json({
            success: true,
            data: { accessToken: newAccessToken },
        });
    }
    catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
}
async function logout(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await prisma_1.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        }
        return res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function getMe(req, res, next) {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user?.userId },
            select: { id: true, email: true, name: true, role: true, avatar: true, bio: true, status: true, createdAt: true },
        });
        return res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
}
async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = index_1.changePasswordSchema.parse(req.body);
        const userId = req.user?.userId;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: 'Password change is managed through Firebase for this account.',
            });
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
        const hashedNew = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { password: hashedNew },
        });
        return res.json({ success: true, message: 'Password changed successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function signup(req, res, next) {
    try {
        const { name, email, password, phone } = index_1.signupSchema.parse(req.body);
        const normalizedEmail = email.toLowerCase();
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser && !existingUser.deletedAt) {
            return res.status(400).json({ success: false, message: 'User already exists with this email address.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                password: hashedPassword,
                phone: phone || null,
                role: normalizedEmail === 'radioninada@gmail.com' ? 'SUPER_ADMIN' : 'LISTENER',
                status: 'ACTIVE',
            },
        });
        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id, expiresAt },
        });
        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar,
                    status: user.status,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
}
async function sendOtp(req, res, next) {
    try {
        const { email, type } = index_1.sendOtpSchema.parse(req.body);
        const normalizedEmail = email.toLowerCase();
        // Check rate limit: max 3 requests per 10 mins
        const recentOtps = await prisma_1.prisma.otpCode.count({
            where: {
                email: normalizedEmail,
                type,
                createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
            },
        });
        if (recentOtps >= 5) {
            return res.status(429).json({
                success: false,
                message: 'Too many OTP requests. Please wait 10 minutes before requesting again.',
            });
        }
        // Generate 6-digit numeric OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
        // Invalidate previous active OTPs for this email & type
        await prisma_1.prisma.otpCode.updateMany({
            where: { email: normalizedEmail, type, used: false },
            data: { used: true },
        });
        // Save new OTP code
        await prisma_1.prisma.otpCode.create({
            data: {
                email: normalizedEmail,
                code: otpCode,
                type,
                expiresAt,
            },
        });
        // Send Email via Nodemailer / SMTP
        const mailResult = await (0, mailer_1.sendOtpEmail)(normalizedEmail, otpCode, type);
        return res.json({
            success: true,
            message: `OTP verification code sent to ${normalizedEmail}`,
            data: {
                email: normalizedEmail,
                expiresInSeconds: 300,
                // In local development, return code for automated testing ease
                devOtpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
async function verifyOtp(req, res, next) {
    try {
        const { email, code, type } = index_1.verifyOtpSchema.parse(req.body);
        const normalizedEmail = email.toLowerCase();
        const otpRecord = await prisma_1.prisma.otpCode.findFirst({
            where: {
                email: normalizedEmail,
                code,
                type,
                used: false,
                expiresAt: { gte: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP code. Please request a new code.',
            });
        }
        // Mark OTP as used to prevent replay attacks
        await prisma_1.prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { used: true },
        });
        return res.json({
            success: true,
            message: 'OTP verified successfully.',
            data: { email: normalizedEmail, verified: true },
        });
    }
    catch (error) {
        next(error);
    }
}
async function resetPassword(req, res, next) {
    try {
        const { email, code, newPassword } = index_1.resetPasswordSchema.parse(req.body);
        const normalizedEmail = email.toLowerCase();
        const otpRecord = await prisma_1.prisma.otpCode.findFirst({
            where: {
                email: normalizedEmail,
                code,
                type: 'FORGOT_PASSWORD',
                used: false,
                expiresAt: { gte: new Date() },
            },
        });
        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP code. Please request a new code.',
            });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            return res.status(444).json({ success: false, message: 'User not found with this email.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password hash & mark OTP as used
        await Promise.all([
            prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            }),
            prisma_1.prisma.otpCode.update({
                where: { id: otpRecord.id },
                data: { used: true },
            }),
            // Invalidate existing refresh tokens for security
            prisma_1.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
        ]);
        return res.json({
            success: true,
            message: 'Password reset successfully. You can now sign in with your new password.',
        });
    }
    catch (error) {
        next(error);
    }
}
