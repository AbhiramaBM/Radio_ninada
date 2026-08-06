/* Radio Ninada - Firebase Client Configuration */
(function () {
  'use strict';

  window.__FIREBASE_CONFIG__ = window.__FIREBASE_CONFIG__ || {
    apiKey: 'AIzaSyDWX5K8hr13D9SgjW-YgeMXhZfVdQzJwlQ',
    authDomain: 'radioninadhawebapp.firebaseapp.com',
    projectId: 'radioninadhawebapp',
    storageBucket: 'radioninadhawebapp.firebasestorage.app',
    messagingSenderId: '318228825550',
    appId: '1:318228825550:web:fe3286caeadf741b30d79f',
    measurementId: 'G-VZY4MGS51F',
  };

  window.__RADIO_ADMIN_EMAIL__ = 'radioninada@gmail.com';
  window.__RADIO_API_BASE__ = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://admin-eight-indol-30.vercel.app/api';
})();
