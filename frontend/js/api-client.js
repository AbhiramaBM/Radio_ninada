/**
 * Radio Ninada - Public Web API Connector Client
 * Connects existing HTML/CSS frontend to the backend REST API
 */

(function () {
  const API_BASE_URL = window.__RADIO_API_BASE__ ||
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : '/api');
  const DEFAULT_TIMEOUT_MS = 8000;

  async function fetchWithTimeout(resource, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  window.RadioNinadaAPI = {
    async getLiveState() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/live`);
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Live state API warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async getPrograms() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/programs`);
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Programs API warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async getPodcasts() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/podcasts`);
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Podcasts API warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async getSchedule() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/schedule`);
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Schedule API warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async getNews() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/news`);
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] News API warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async getRJs() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/rj`);
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] RJs API warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async getEvents() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/events`);
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Events API warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async getGallery() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/gallery`);
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Gallery API warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async getBanners() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/banners`);
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Banners API warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    // Notifications API
    async getNotifications() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/notifications`);
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Notifications API warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async markNotificationRead(id) {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/notifications/${id}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        });
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Mark notification read warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async markAllNotificationsRead() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/notifications/read-all`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        });
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Mark all notifications read warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    // Playlists API
    async getPlaylists() {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/playlists`);
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Playlists API warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async createPlaylist(name, description = '') {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/playlists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description }),
        });
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Create playlist warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async updatePlaylist(id, name, description = '') {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/playlists/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description }),
        });
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Update playlist warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async deletePlaylist(id) {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/playlists/${id}`, {
          method: 'DELETE',
        });
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Delete playlist warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async addPlaylistItem(id, item) {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/playlists/${id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Add playlist item warning:', e.message);
        return { success: false, error: e.message };
      }
    },

    async removePlaylistItem(id, itemId) {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/playlists/${id}/items/${itemId}`, {
          method: 'DELETE',
        });
        return await res.json();
      } catch (e) {
        console.warn('[RadioNinadaAPI] Remove playlist item warning:', e.message);
        return { success: false, error: e.message };
      }
    },
  };

  console.log('📡 Radio Ninada API Connector Initialized ->', API_BASE_URL);
})();
