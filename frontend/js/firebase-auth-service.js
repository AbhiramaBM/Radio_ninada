/* Radio Ninada - Firebase Authentication Service (Email, Google, Phone OTP) */
(function () {
  'use strict';

  if (typeof firebase === 'undefined') {
    console.warn('[RadioAuth] Firebase SDK not loaded. Auth will run in demo mode.');
    return;
  }

  const config = window.__FIREBASE_CONFIG__ || {};
  if (!config.apiKey || !config.projectId) {
    console.warn('[RadioAuth] Firebase config missing. Set values in frontend/js/firebase-config.js');
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }

  const auth = firebase.auth();
  const db = firebase.firestore();
  const ADMIN_EMAIL = (window.__RADIO_ADMIN_EMAIL__ || 'radioninada@gmail.com').toLowerCase();

  let recaptchaVerifier = null;
  let phoneConfirmation = null;

  function resolveRole(email, phone) {
    const normalized = String(email || '').toLowerCase();
    if (normalized === ADMIN_EMAIL) return 'SUPER_ADMIN';
    if (phone) return 'LISTENER';
    return 'LISTENER';
  }

  async function syncUserProfile(user, extra) {
    const email = (user.email || extra?.email || '').toLowerCase();
    const phone = user.phoneNumber || extra?.phone || null;
    const role = resolveRole(email, phone);
    const profile = {
      uid: user.uid,
      email: email || null,
      phone,
      name: user.displayName || extra?.name || (email ? email.split('@')[0] : 'Radio Listener'),
      role,
      isAdmin: role === 'SUPER_ADMIN' || role === 'ADMIN',
      photoURL: user.photoURL || null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(user.uid).set(profile, { merge: true });
    return profile;
  }

  async function exchangeBackendToken(idToken) {
    const apiBase = window.__RADIO_API_BASE__ ||
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : '/api');
    try {
      const res = await fetch(`${apiBase}/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('ninada_access_token', data.data.accessToken);
        localStorage.setItem('ninada_refresh_token', data.data.refreshToken);
      }
      return data;
    } catch (err) {
      console.warn('[RadioAuth] Backend token exchange skipped:', err.message);
      return null;
    }
  }

  window.RadioFirebaseAuth = {
    auth,
    db,
    ADMIN_EMAIL,

    isReady: function () {
      return Boolean(config.apiKey && config.projectId);
    },

    signUpWithEmail: async function (email, password, name) {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (name) await cred.user.updateProfile({ displayName: name });
      const profile = await syncUserProfile(cred.user, { email, name });
      const idToken = await cred.user.getIdToken();
      await exchangeBackendToken(idToken);
      return { user: cred.user, profile };
    },

    signInWithEmail: async function (email, password) {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      const profile = await syncUserProfile(cred.user, { email });
      const idToken = await cred.user.getIdToken();
      await exchangeBackendToken(idToken);
      return { user: cred.user, profile };
    },

    signInWithGoogle: async function () {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      let cred = null;
      try {
        cred = await auth.signInWithPopup(provider);
      } catch (err) {
        if (err.code === 'auth/popup-blocked') {
          console.warn('[RadioAuth] Google Sign-In popup blocked, attempting redirect...');
          await auth.signInWithRedirect(provider);
          return null;
        }
        throw err;
      }
      if (!cred?.user) throw new Error('Google authentication was cancelled or failed.');
      const profile = await syncUserProfile(cred.user);
      const idToken = await cred.user.getIdToken();
      await exchangeBackendToken(idToken);
      return { user: cred.user, profile };
    },

    initRecaptcha: function (containerId) {
      const targetId = containerId || 'firebase-recaptcha-container';
      let el = document.getElementById(targetId);
      if (!el) {
        el = document.createElement('div');
        el.id = targetId;
        document.body.appendChild(el);
      }
      if (recaptchaVerifier) {
        try { recaptchaVerifier.clear(); } catch (_) {}
      }
      recaptchaVerifier = new firebase.auth.RecaptchaVerifier(targetId, {
        size: 'invisible',
        callback: function () {},
        'expired-callback': function () {
          console.warn('[RadioAuth] Recaptcha expired, resetting...');
        }
      });
      return recaptchaVerifier;
    },

    sendPhoneOTP: async function (phoneNumber, containerId) {
      const verifier = this.initRecaptcha(containerId || 'firebase-recaptcha-container');
      phoneConfirmation = await auth.signInWithPhoneNumber(phoneNumber, verifier);
      return phoneConfirmation;
    },

    verifyPhoneOTP: async function (code, extra) {
      if (!phoneConfirmation) throw new Error('No OTP session. Send OTP first.');
      const cred = await phoneConfirmation.confirm(code);
      const profile = await syncUserProfile(cred.user, extra || {});
      const idToken = await cred.user.getIdToken();
      await exchangeBackendToken(idToken);
      phoneConfirmation = null;
      return { user: cred.user, profile };
    },

    resendPhoneOTP: async function (phoneNumber, containerId) {
      return this.sendPhoneOTP(phoneNumber, containerId);
    },

    sendPasswordReset: async function (email) {
      await auth.sendPasswordResetEmail(email);
    },

    signOut: async function () {
      await auth.signOut();
      localStorage.removeItem('radio_ninada_user');
      localStorage.removeItem('ninada_access_token');
      localStorage.removeItem('ninada_refresh_token');
    },

    getCurrentSession: async function () {
      const user = auth.currentUser;
      if (!user) return null;
      const doc = await db.collection('users').doc(user.uid).get();
      const profile = doc.exists ? doc.data() : await syncUserProfile(user);
      return { user, profile };
    },

    onAuthStateChanged: function (callback) {
      return auth.onAuthStateChanged(callback);
    },
  };
})();
