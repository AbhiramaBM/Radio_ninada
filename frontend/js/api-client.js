/**
 * Radio Ninada - Public Web API Connector Client
 * Connects existing HTML/CSS frontend to the backend REST API
 */

(function () {
  const API_BASE_URL = 'http://localhost:5000/api';

  window.RadioNinadaAPI = {
    async getLiveState() {
      try {
        const res = await fetch(`${API_BASE_URL}/live`);
        return await res.json();
      } catch (e) {
        console.warn('Backend API unreachable, using fallback live state');
        return { success: false };
      }
    },

    async getPrograms() {
      try {
        const res = await fetch(`${API_BASE_URL}/programs`);
        return await res.json();
      } catch (e) {
        return { success: false };
      }
    },

    async getPodcasts() {
      try {
        const res = await fetch(`${API_BASE_URL}/podcasts`);
        return await res.json();
      } catch (e) {
        return { success: false };
      }
    },

    async getSchedule() {
      try {
        const res = await fetch(`${API_BASE_URL}/schedule`);
        return await res.json();
      } catch (e) {
        return { success: false };
      }
    },

    async getNews() {
      try {
        const res = await fetch(`${API_BASE_URL}/news`);
        return await res.json();
      } catch (e) {
        return { success: false };
      }
    },

    async getRJs() {
      try {
        const res = await fetch(`${API_BASE_URL}/rj`);
        return await res.json();
      } catch (e) {
        return { success: false };
      }
    },

    async getEvents() {
      try {
        const res = await fetch(`${API_BASE_URL}/events`);
        return await res.json();
      } catch (e) {
        return { success: false };
      }
    },

    async getGallery() {
      try {
        const res = await fetch(`${API_BASE_URL}/gallery`);
        return await res.json();
      } catch (e) {
        return { success: false };
      }
    },

    async getBanners() {
      try {
        const res = await fetch(`${API_BASE_URL}/banners`);
        return await res.json();
      } catch (e) {
        return { success: false };
      }
    },
  };

  console.log('📡 Radio Ninada API Connector Initialized ->', API_BASE_URL);
})();

