import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { loginSchema, changePasswordSchema } from '../validation/index';
import { AuthenticatedRequest } from '../middlewares/auth';

/**
 * Staff/Admin Login
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token in database (7 days validity)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
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
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh Access Token
 * POST /api/auth/refresh
 */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!existingToken || existingToken.expiresAt < new Date()) {
      if (existingToken) {
        await prisma.refreshToken.delete({ where: { id: existingToken.id } });
      }
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const newAccessToken = generateAccessToken({
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
  } catch (error) {
    next(error);
  }
}

/**
 * Staff Logout
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Current Authenticated Profile
 * GET /api/auth/me
 */
export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
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
  } catch (error) {
    next(error);
  }
}

/**
 * Change Password
 * POST /api/auth/change-password
 */
export async function changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
}
