import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'radioninada@gmail.com').toLowerCase();

function getFirebaseApp() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase client config is missing. Add NEXT_PUBLIC_FIREBASE_* variables to admin/.env.local');
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getClientAuth() {
  if (typeof window === 'undefined') return null;
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
}

export async function signInWithFirebaseEmail(email: string, password: string) {
  const clientAuth = getClientAuth();
  if (!clientAuth) throw new Error('Firebase Auth is not available');
  return signInWithEmailAndPassword(clientAuth, email, password);
}

export async function signInWithGoogle() {
  const clientAuth = getClientAuth();
  if (!clientAuth) throw new Error('Firebase Auth is not available');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(clientAuth, provider);
}

export async function createFirebaseUser(email: string, password: string) {
  const clientAuth = getClientAuth();
  if (!clientAuth) throw new Error('Firebase Auth is not available');
  return createUserWithEmailAndPassword(clientAuth, email, password);
}

export async function getFirebaseIdToken() {
  const clientAuth = getClientAuth();
  if (!clientAuth?.currentUser) throw new Error('No Firebase user signed in');
  return clientAuth.currentUser.getIdToken();
}

export async function firebaseSignOut() {
  const clientAuth = getClientAuth();
  if (!clientAuth) return;
  await signOut(clientAuth);
}

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'RJ' | 'MODERATOR' | 'LISTENER';

export interface UserProfilePayload {
  uid: string;
  email: string | null;
  name: string;
  role: AdminRole;
  isAdmin: boolean;
  status: string;
  photoURL?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export function resolveUserRole(email?: string | null, phone?: string | null): AdminRole {
  const normalizedEmail = (email || '').toLowerCase();
  if (normalizedEmail === ADMIN_EMAIL) return 'SUPER_ADMIN';
  if (normalizedEmail.endsWith('@radioninada.local') || normalizedEmail.includes('admin')) return 'ADMIN';
  if (phone) return 'LISTENER';
  return 'LISTENER';
}

export async function ensureUserProfile(user: FirebaseUser | null | undefined, extra: Partial<UserProfilePayload> = {}) {
  if (!user?.uid) return null;

  const db = getFirebaseDb();
  const refDoc = doc(db, 'users', user.uid);
  const existing = await getDoc(refDoc);
  const email = (user.email || extra.email || '').toLowerCase();
  const role = extra.role || resolveUserRole(email);
  const payload: UserProfilePayload = {
    uid: user.uid,
    email: email || null,
    name: extra.name || user.displayName || email.split('@')[0] || 'Radio User',
    role,
    isAdmin: role === 'SUPER_ADMIN' || role === 'ADMIN',
    status: extra.status || 'ACTIVE',
    photoURL: extra.photoURL || user.photoURL || null,
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(refDoc, payload, { merge: true });
  return payload;
}

export async function uploadFileToStorage(file: File, path: string) {
  const storage = getFirebaseStorage();
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const fileRef = ref(storage, `${path}/${fileName}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
