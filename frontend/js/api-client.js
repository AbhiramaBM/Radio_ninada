/**
 * Radio Ninada - Clean REST API Client
 * Connects frontend directly to backend REST endpoints. No Firebase.
 */
(function () {
  'use strict';

  // Resolve API Base URL flexibly across all deployment modes:
  let dynamicBase = '';
  try {
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const queryBase = urlParams.get('api_base');
      if (queryBase) {
        localStorage.setItem('radio_api_base', queryBase);
      }
      dynamicBase = localStorage.getItem('radio_api_base') || '';
    }
  } catch (_) {}

  const API_BASE_URL = (typeof window !== 'undefined' && window.__RADIO_API_BASE__) ||
    dynamicBase ||
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? (window.location.port === '5000' ? '/api' : 'http://localhost:5000/api')
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

    // Don't set Content-Type for FormData, File, or Blob
    if (
      options.body instanceof FormData ||
      (typeof File !== 'undefined' && options.body instanceof File) ||
      (typeof Blob !== 'undefined' && options.body instanceof Blob)
    ) {
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

    async uploadMedia(fileOrFormData, folder = 'radio-ninada/media') {
      let file;
      if (fileOrFormData instanceof FormData) {
        file = fileOrFormData.get('file');
        folder = fileOrFormData.get('folder') || folder;
      } else {
        file = fileOrFormData;
      }

      // 1. Direct Cloudinary Signed Upload (Supports any size, bypasses Vercel 4.5MB limit!)
      if (file && (file instanceof File || file instanceof Blob)) {
        try {
          const sigRes = await fetchApi(`/media/signature?folder=${encodeURIComponent(folder)}`);
          if (sigRes && sigRes.success && sigRes.data) {
            const { signature, timestamp, cloudName, apiKey } = sigRes.data;
            const isAudio = file.type && (file.type.startsWith('audio/') || file.type.startsWith('video/'));
            const resourceType = isAudio ? 'video' : 'image';

            const directFormData = new FormData();
            directFormData.append('file', file);
            directFormData.append('api_key', apiKey);
            directFormData.append('timestamp', timestamp);
            directFormData.append('signature', signature);
            directFormData.append('folder', folder);

            const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
              method: 'POST',
              body: directFormData,
            });

            const cloudData = await cloudRes.json();
            if (cloudRes.ok && cloudData.secure_url) {
              // Record directly uploaded asset into database
              const recordRes = await fetchApi('/media/record', {
                method: 'POST',
                body: JSON.stringify({
                  originalName: file.name || 'file',
                  cloudinaryPublicId: cloudData.public_id,
                  cloudinaryUrl: cloudData.secure_url,
                  resourceType: cloudData.resource_type || resourceType,
                  format: cloudData.format,
                  fileSize: cloudData.bytes,
                  duration: cloudData.duration,
                  width: cloudData.width,
                  height: cloudData.height,
                  folder: folder,
                }),
              });

              return {
                success: true,
                data: {
                  id: recordRes?.data?.id || cloudData.public_id,
                  url: cloudData.secure_url,
                  secureUrl: cloudData.secure_url,
                  publicId: cloudData.public_id,
                  resourceType: cloudData.resource_type || resourceType,
                  format: cloudData.format,
                  bytes: cloudData.bytes,
                  duration: cloudData.duration,
                  folder: folder,
                },
              };
            }
          }
        } catch (directErr) {
          console.warn('[uploadMedia] Direct upload fallback to proxy:', directErr.message);
        }
      }

      // 2. Server proxy fallback
      let body;
      if (fileOrFormData instanceof FormData) {
        body = fileOrFormData;
      } else {
        body = new FormData();
        body.append('file', fileOrFormData);
        body.append('folder', folder);
      }
      return await fetchApi('/media/upload', {
        method: 'POST',
        body,
      }, 180000);
    },

    async deleteMedia(id) {
      return await fetchApi(`/media/${id}`, {
        method: 'DELETE',
      });
    },

    // Admin CRUD Operations
    async createPodcast(data) {
      return await fetchApi('/podcasts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async deletePodcast(id) {
      return await fetchApi(`/podcasts/${id}`, {
        method: 'DELETE',
      });
    },

    async createProgram(data) {
      return await fetchApi('/programs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async deleteProgram(id) {
      return await fetchApi(`/programs/${id}`, {
        method: 'DELETE',
      });
    },

    async getHosts() {
      return await fetchApi('/hosts');
    },

    async createHost(data) {
      return await fetchApi('/hosts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async deleteHost(id) {
      return await fetchApi(`/hosts/${id}`, {
        method: 'DELETE',
      });
    },

    async createBanner(dataOrFormData) {
      const isFormData = typeof FormData !== 'undefined' && dataOrFormData instanceof FormData;
      return await fetchApi('/banners', {
        method: 'POST',
        body: isFormData ? dataOrFormData : JSON.stringify(dataOrFormData),
      });
    },

    async deleteBanner(id) {
      return await fetchApi(`/banners/${id}`, {
        method: 'DELETE',
      });
    },

    async getBanners() {
      return await fetchApi('/banners');
    },

    async toggleLiveBroadcast() {
      return await fetchApi('/live/toggle', {
        method: 'POST',
      });
    },

    async addEpisode(podcastId, data) {
      return await fetchApi(`/podcasts/${podcastId}/episodes`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async createNews(data) {
      return await fetchApi('/news', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async deleteNews(id) {
      return await fetchApi(`/news/${id}`, {
        method: 'DELETE',
      });
    },

    async createEvent(data) {
      return await fetchApi('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async deleteEvent(id) {
      return await fetchApi(`/events/${id}`, {
        method: 'DELETE',
      });
    },

    async getGallery(params = {}) {
      const query = new URLSearchParams(params).toString();
      return await fetchApi(`/gallery${query ? '?' + query : ''}`);
    },

    async createGalleryItem(data) {
      return await fetchApi('/gallery', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async deleteGalleryItem(id) {
      return await fetchApi(`/gallery/${id}`, {
        method: 'DELETE',
      });
    },

    async getAnnouncements() {
      return await fetchApi('/announcements');
    },

    async createAnnouncement(data) {
      return await fetchApi('/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async deleteAnnouncement(id) {
      return await fetchApi(`/announcements/${id}`, {
        method: 'DELETE',
      });
    },

    async updateLiveState(data) {
      return await fetchApi('/live', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async getContactMessages() {
      return await fetchApi('/contact');
    },

    async changePassword(currentPassword, newPassword) {
      return await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },

    async getCurrentStaff() {
      return await fetchApi('/auth/me');
    },

    getBaseUrl() {
      return API_BASE_URL;
    },

    setBaseUrl(url) {
      if (!url) {
        localStorage.removeItem('radio_api_base');
      } else {
        localStorage.setItem('radio_api_base', url.trim());
      }
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
    },
  };

  // Backward-compatibility alias
  window.RadioNinadaAPI = window.RadioAPI;

  console.log('📻 Radio Ninada Clean API Client initialized ->', API_BASE_URL);
})();
