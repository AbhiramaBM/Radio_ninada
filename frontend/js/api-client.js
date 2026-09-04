/**
 * Radio Ninada - Clean REST API Client
 * Connects frontend directly to backend REST endpoints. No Firebase.
 */
(function () {
  'use strict';

  const API_BASE_URL = window.__RADIO_API_BASE__ ||
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : '/api');

  const DEFAULT_TIMEOUT_MS = 10000;

  async function fetchApi(endpoint, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    // Include auth token if available (for staff/admin actions)
    const token = localStorage.getItem('radio_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const data = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[RadioAPI Error] ${endpoint}:`, err.message);
      return { success: false, error: err.message, message: err.message };
    }
  }

  window.RadioAPI = {
    baseUrl: API_BASE_URL,

    // Public Station APIs (no authentication needed)
    async getLiveState() {
      return await fetchApi('/live');
    },

    async getPrograms() {
      return await fetchApi('/programs');
    },

    async getPodcasts() {
      return await fetchApi('/podcasts');
    },

    async getPodcast(idOrSlug) {
      return await fetchApi(`/podcasts/${idOrSlug}`);
    },

    async getSchedule() {
      return await fetchApi('/schedule');
    },

    async getNews() {
      return await fetchApi('/news');
    },

    async getRJs() {
      return await fetchApi('/rj');
    },

    async getEvents() {
      return await fetchApi('/events');
    },

    async getGallery() {
      return await fetchApi('/gallery');
    },

    async getBanners() {
      return await fetchApi('/banners');
    },

    async getNotifications() {
      return await fetchApi('/notifications');
    },

    async getPlaylists() {
      return await fetchApi('/playlists');
    },

    async sendContactMessage(payload) {
      return await fetchApi('/contact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    // Staff/Admin Auth & Media APIs
    async staffLogin(email, password) {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.success && res.accessToken) {
        localStorage.setItem('radio_token', res.accessToken);
        localStorage.setItem('radio_user', JSON.stringify(res.user));
      }
      return res;
    },

    staffLogout() {
      localStorage.removeItem('radio_token');
      localStorage.removeItem('radio_user');
      window.location.reload();
    },

    getStaffUser() {
      try {
        const stored = localStorage.getItem('radio_user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    },

    isStaffLoggedIn() {
      return Boolean(localStorage.getItem('radio_token'));
    },

    // Media Library APIs (for Staff/Admin)
    async listMedia(params = {}) {
      const query = new URLSearchParams(params).toString();
      return await fetchApi(`/media${query ? '?' + query : ''}`);
    },

    async uploadMedia(formData) {
      return await fetchApi('/media/upload', {
        method: 'POST',
        body: formData,
      });
    },

    async deleteMedia(id) {
      return await fetchApi(`/media/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // Backward-compatibility alias
  window.RadioNinadaAPI = window.RadioAPI;

  console.log('📻 Radio Ninada Clean API Client initialized ->', API_BASE_URL);
})();
