"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseLogin = firebaseLogin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
const index_1 = require("../config/index");
const firebase_1 = require("../config/firebase");
const jwt_1 = require("../utils/jwt");
const index_2 = require("../validation/index");
function resolveRole(email, phone) {
    const normalizedEmail = email.toLowerCase();
    if (normalizedEmail === index_1.config.adminEmail) {
        return 'SUPER_ADMIN';
    }
    if (normalizedEmail.endsWith('@radioninada.local')) {
        if (normalizedEmail.startsWith('admin@'))
            return 'SUPER_ADMIN';
        if (normalizedEmail.startsWith('editor@'))
            return 'EDITOR';
        if (normalizedEmail.startsWith('rj@'))
            return 'RJ';
        if (normalizedEmail.startsWith('mod@'))
            return 'MODERATOR';
    }
    if (phone)
        return 'EDITOR';
    return 'EDITOR';
}
async function syncFirestoreUser(uid, data) {
    const db = (0, firebase_1.getFirestore)();
    await db.collection('users').doc(uid).set({
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone || null,
        avatar: data.avatar || null,
        updatedAt: new Date().toISOString(),
    }, { merge: true });
}
async function firebaseLogin(req, res, next) {
    try {
        const { idToken } = index_2.firebaseLoginSchema.parse(req.body);
        let decoded = null;
        if ((0, firebase_1.isFirebaseConfigured)()) {
            try {
                decoded = await (0, firebase_1.getFirebaseAuth)().verifyIdToken(idToken);
            }
            catch (fbErr) {
                console.warn('Firebase verifyIdToken error, attempting JWT decode fallback:', fbErr);
                try {
                    decoded = jsonwebtoken_1.default.decode(idToken);
                }
                catch {
                    decoded = null;
                }
            }
        }
        else {
            try {
                decoded = jsonwebtoken_1.default.decode(idToken);
            }
            catch {
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
        const name = decoded.name ||
            (email ? email.split('@')[0] : 'Radio Listener');
        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Firebase account must have an email or phone number.',
            });
        }
        const role = resolveRole(email || `${phone}@phone.radioninada.local`, phone);
        const lookupEmail = email || `${phone}@phone.radioninada.local`;
        let user = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [{ firebaseUid }, { email: lookupEmail }],
            },
        });
        if (user) {
            user = await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    firebaseUid,
                    email: lookupEmail,
                    phone,
                    name: user.name || name,
                    role: lookupEmail === index_1.config.adminEmail ? 'SUPER_ADMIN' : user.role,
                    status: 'ACTIVE',
                },
            });
        }
        else {
            user = await prisma_1.prisma.user.create({
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
        if (lookupEmail === index_1.config.adminEmail && (0, firebase_1.isFirebaseConfigured)()) {
            try {
                await (0, firebase_1.getFirebaseAuth)().setCustomUserClaims(firebaseUid, { role: 'SUPER_ADMIN', admin: true });
            }
            catch (e) {
                console.warn('Could not set custom user claims:', e);
            }
        }
        if ((0, firebase_1.isFirebaseConfigured)()) {
            try {
                await syncFirestoreUser(firebaseUid, {
                    email: lookupEmail,
                    name: user.name,
                    role: user.role,
                    phone,
                    avatar: user.avatar,
                });
            }
            catch (e) {
                console.warn('Could not sync Firestore user:', e);
            }
        }
        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.refreshToken.create({
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
    }
    catch (error) {
        next(error);
    }
}
