"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirebaseAdmin = getFirebaseAdmin;
exports.getFirebaseAuth = getFirebaseAuth;
exports.getFirestore = getFirestore;
exports.isFirebaseConfigured = isFirebaseConfigured;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const index_1 = require("./index");
let firebaseApp = null;
function getFirebaseAdmin() {
    if (firebaseApp)
        return firebaseApp;
    const { projectId, clientEmail, privateKey } = index_1.config.firebase;
    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env');
    }
    firebaseApp = firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
    });
    return firebaseApp;
}
function getFirebaseAuth() {
    return getFirebaseAdmin().auth();
}
function getFirestore() {
    return getFirebaseAdmin().firestore();
}
function isFirebaseConfigured() {
    const { projectId, clientEmail, privateKey } = index_1.config.firebase;
    if (!projectId || !clientEmail || !privateKey)
        return false;
    if (privateKey.includes('gs://your-project-id.iam.gserviceaccount.com/your-private-key.json') || clientEmail.includes('xxxxx'))
        return false;
    return true;
}
