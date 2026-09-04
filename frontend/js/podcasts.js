/**
 * Radio Ninada - Podcasts Manager
 * Loads podcasts and episodes from backend API and handles audio playback.
 */
(function () {
  'use strict';

  window.RadioPodcasts = {
    podcasts: [],
    activeCategory: 'ALL',

    async init() {
      await this.loadPodcasts();
    },

    async loadPodcasts() {
      const container = document.getElementById('podcast-cards-container');
      if (!container) return;

      try {
        const res = await window.RadioAPI.getPodcasts();
        if (res && res.success && Array.isArray(res.data)) {
          this.podcasts = res.data;
          this.render();
        }
      } catch (err) {
        console.warn('[RadioPodcasts] Failed to load podcasts:', err);
      }
    },

    setCategory(category) {
      this.activeCategory = category;
      this.render();
    },

    render() {
      const container = document.getElementById('podcast-cards-container');
      if (!container) return;

      const filtered = this.activeCategory === 'ALL'
        ? this.podcasts
        : this.podcasts.filter((p) => (p.category?.name || p.category) === this.activeCategory);

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-12 text-center text-on-surface-variant">
            <span class="material-symbols-outlined text-4xl text-primary/60 mb-2">podcasts</span>
            <p class="text-base font-semibold">No podcasts found in this category.</p>
          </div>`;
        return;
      }

      container.innerHTML = filtered.map((podcast) => {
        const title = window.RadioUtils?.escapeHtml(podcast.title) || podcast.title;
        const desc = window.RadioUtils?.escapeHtml(podcast.description) || podcast.description;
        const cover = podcast.coverUrl || 'images/podcast_default.jpg';
        const hostName = podcast.host?.name || 'Radio Ninada Host';
        const episodesCount = podcast.episodes?.length || 1;
        const categoryName = podcast.category?.name || podcast.category || 'Talk Show';

        // Play the first episode or audioUrl
        const firstEpisode = podcast.episodes && podcast.episodes[0];
        const audioUrl = firstEpisode?.audioUrl || podcast.audioUrl || '';

        return `
          <div class="glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
            <div class="relative aspect-video overflow-hidden bg-surface-container">
              <img src="${cover}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div class="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-white">
                ${categoryName}
              </div>
              <button onclick="window.RadioPodcasts.playPodcast('${podcast.id}')"
                class="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer">
                <span class="material-symbols-outlined text-2xl">play_arrow</span>
              </button>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 class="font-headline-md text-lg font-bold text-on-surface line-clamp-1 mb-1">${title}</h3>
                <p class="text-xs text-primary font-medium mb-2">${hostName} • ${episodesCount} Episode${episodesCount > 1 ? 's' : ''}</p>
                <p class="text-sm text-on-surface-variant line-clamp-2">${desc}</p>
              </div>
            </div>
          </div>`;
      }).join('');
    },

    playPodcast(id) {
      const podcast = this.podcasts.find((p) => p.id === id);
      if (!podcast) return;

      const firstEp = podcast.episodes && podcast.episodes[0];
      const audioUrl = firstEp?.audioUrl || podcast.audioUrl;

      if (!audioUrl) {
        if (window.showToast) window.showToast('Episode audio is currently processing.');
        return;
      }

      if (window.RadioPlayer) {
        window.RadioPlayer.playTrack({
          url: audioUrl,
          title: firstEp?.title || podcast.title,
          artist: podcast.host?.name || 'Radio Ninada Podcast',
          cover: podcast.coverUrl,
          isLive: false,
        });
      }
    },
  };
})();
