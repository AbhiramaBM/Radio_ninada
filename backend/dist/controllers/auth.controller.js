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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../config/prisma");
const jwt_1 = require("../utils/jwt");
const index_1 = require("../validation/index");
/**
 * Staff/Admin Login
 * POST /api/auth/login
 */
async function login(req, res, next) {
    try {
        const { email, password } = index_1.loginSchema.parse(req.body);
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user || user.deletedAt) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                message: `Account is ${user.status.toLowerCase()}. Please contact system administrator.`,
            });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        // Save refresh token in database (7 days validity)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });
        const userObj = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            status: user.status,
        };
        return res.json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: userObj,
            data: {
                accessToken,
                refreshToken,
                user: userObj,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Refresh Access Token
 * POST /api/auth/refresh
 */
async function refresh(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token is required' });
        }
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const existingToken = await prisma_1.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!existingToken || existingToken.expiresAt < new Date()) {
            if (existingToken) {
                await prisma_1.prisma.refreshToken.delete({ where: { id: existingToken.id } });
            }
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }
        const newAccessToken = (0, jwt_1.generateAccessToken)({
            userId: existingToken.user.id,
            email: existingToken.user.email,
            role: existingToken.user.role,
        });
        return res.json({
            success: true,
            message: 'Token refreshed successfully',
            accessToken: newAccessToken,
            data: {
                accessToken: newAccessToken,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Staff Logout
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await prisma_1.prisma.refreshToken.deleteMany({
                where: { token: refreshToken },
            });
        }
        return res.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get Current Authenticated Profile
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                avatar: true,
                bio: true,
                status: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.json({
            success: true,
            data: user,
            user,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Change Password
 * POST /api/auth/change-password
 */
async function changePassword(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        const { currentPassword, newPassword } = index_1.changePasswordSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
        });
        return res.json({
            success: true,
            message: 'Password updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
}
