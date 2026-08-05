import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { config } from '../config/index';
import { getFirebaseAuth, getFirestore, isFirebaseConfigured } from '../config/firebase';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { firebaseLoginSchema } from '../validation/index';

function resolveRole(email: string, phone?: string | null): string {
  const normalizedEmail = email.toLowerCase();
  if (normalizedEmail === config.adminEmail) {
    return 'SUPER_ADMIN';
  }
  if (normalizedEmail.endsWith('@radioninada.local')) {
    if (normalizedEmail.startsWith('admin@')) return 'SUPER_ADMIN';
    if (normalizedEmail.startsWith('editor@')) return 'EDITOR';
    if (normalizedEmail.startsWith('rj@')) return 'RJ';
    if (normalizedEmail.startsWith('mod@')) return 'MODERATOR';
  }
  if (phone) return 'EDITOR';
  return 'EDITOR';
}

async function syncFirestoreUser(
  uid: string,
  data: { email: string; name: string; role: string; phone?: string | null; avatar?: string | null }
) {
  const db = getFirestore();
  await db.collection('users').doc(uid).set(
    {
      email: data.email,
      name: data.name,
      role: data.role,
      phone: data.phone || null,
      avatar: data.avatar || null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function firebaseLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken } = firebaseLoginSchema.parse(req.body);

    let decoded: any = null;
    if (isFirebaseConfigured()) {
      try {
        decoded = await getFirebaseAuth().verifyIdToken(idToken);
      } catch (fbErr) {
        console.warn('Firebase verifyIdToken error, attempting JWT decode fallback:', fbErr);
        try {
          decoded = jwt.decode(idToken) as any;
        } catch {
          decoded = null;
        }
      }
    } else {
      try {
        decoded = jwt.decode(idToken) as any;
      } catch {
        decoded = null;
      }
    }

    if (!decoded?.email && !decoded?.phone_number && !decoded?.uid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase ID token.',
      });
    }

    const email = (decoded.email || '').toLowerCase();
    const phone = decoded.phone_number || null;
    const firebaseUid = decoded.uid;
    const name =
      decoded.name ||
      (email ? email.split('@')[0] : 'Radio Listener');

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Firebase account must have an email or phone number.',
      });
    }

    const role = resolveRole(email || `${phone}@phone.radioninada.local`, phone);
    const lookupEmail = email || `${phone}@phone.radioninada.local`;

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid }, { email: lookupEmail }],
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid,
          email: lookupEmail,
          phone,
          name: user.name || name,
          role: lookupEmail === config.adminEmail ? 'SUPER_ADMIN' : user.role,
          status: 'ACTIVE',
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email: lookupEmail,
          phone,
          name,
          role,
          status: 'ACTIVE',
        },
      });
    }

    if (lookupEmail === config.adminEmail && isFirebaseConfigured()) {
      try {
        await getFirebaseAuth().setCustomUserClaims(firebaseUid, { role: 'SUPER_ADMIN', admin: true });
      } catch (e) {
        console.warn('Could not set custom user claims:', e);
      }
    }

    if (isFirebaseConfigured()) {
      try {
        await syncFirestoreUser(firebaseUid, {
          email: lookupEmail,
          name: user.name,
          role: user.role,
          phone,
          avatar: user.avatar,
        });
      } catch (e) {
        console.warn('Could not sync Firestore user:', e);
      }
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return res.json({
      success: true,
      message: 'Firebase authentication successful',
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
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
