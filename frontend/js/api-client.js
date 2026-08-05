/**
 * Radio Ninada - Public Web API Connector Client
 * Connects existing HTML/CSS frontend to the backend REST API
 */

(function () {
  const API_BASE_URL = 'http://localhost:5000/api';
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
  };

  console.log('📡 Radio Ninada API Connector Initialized ->', API_BASE_URL);
})();
