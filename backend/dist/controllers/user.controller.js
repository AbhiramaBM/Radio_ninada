"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.createUser = createUser;
exports.updateUserRole = updateUserRole;
exports.updateUserStatus = updateUserStatus;
exports.deleteUser = deleteUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../config/prisma");
const index_1 = require("../validation/index");
async function getUsers(req, res, next) {
    try {
        const { search, role, status, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const where = { deletedAt: null };
        if (role)
            where.role = role;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
            ];
        }
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                select: { id: true, email: true, name: true, role: true, avatar: true, bio: true, status: true, createdAt: true },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        return res.json({
            success: true,
            data: users,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    }
    catch (error) {
        next(error);
    }
}
async function createUser(req, res, next) {
    try {
        const data = index_1.userCreateSchema.parse(req.body);
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: { ...data, password: hashedPassword },
            select: { id: true, email: true, name: true, role: true, avatar: true, bio: true, status: true, createdAt: true },
        });
        return res.status(201).json({ success: true, message: 'User created successfully', data: user });
    }
    catch (error) {
        next(error);
    }
}
async function updateUserRole(req, res, next) {
    try {
        const id = req.params.id;
        const { role } = req.body;
        if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ', 'MODERATOR'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, email: true, name: true, role: true, status: true },
        });
        return res.json({ success: true, message: `User role updated to ${role}`, data: user });
    }
    catch (error) {
        next(error);
    }
}
async function updateUserStatus(req, res, next) {
    try {
        const id = req.params.id;
        const { status } = req.body;
        if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data: { status },
            select: { id: true, email: true, name: true, role: true, status: true },
        });
        return res.json({ success: true, message: `User status changed to ${status}`, data: user });
    }
    catch (error) {
        next(error);
    }
}
async function deleteUser(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return res.json({ success: true, message: 'User soft-deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
