/**
 * Radio Ninada - HTML5 Audio Player Engine
 * Manages live stream broadcasting and on-demand podcast episode streaming.
 */
(function () {
  'use strict';

  window.RadioPlayer = {
    audio: null,
    isPlaying: false,
    isLiveStream: true,
    volume: 0.8,
    currentTrack: {
      url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
      title: 'Radio Ninada 90.4 FM Live',
      artist: 'RJ Ananya • Ninada Morning Buzz',
      cover: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
      isLive: true,
    },

    init() {
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.preload = 'none';
        this.audio.volume = this.volume;

        this.audio.addEventListener('play', () => this.onPlayStateChange(true));
        this.audio.addEventListener('pause', () => this.onPlayStateChange(false));
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('timeupdate', () => this.updateTimeProgress());
        this.audio.addEventListener('error', (e) => this.onError(e));
      }

      this.bindControls();
      this.loadLiveConfig();
    },

    async loadLiveConfig() {
      if (window.RadioAPI && typeof window.RadioAPI.getLiveState === 'function') {
        try {
          const res = await window.RadioAPI.getLiveState();
          if (res && res.success && res.data) {
            const d = res.data;
            if (d.streamUrl) this.currentTrack.url = d.streamUrl;
            if (d.title) this.currentTrack.title = d.title;
            if (d.currentHost || d.currentProgram) {
              this.currentTrack.artist = `${d.currentHost || 'RJ Ananya'} • ${d.currentProgram || 'Radio Ninada'}`;
            }
            this.updateUI();
          }
        } catch (err) {
          console.warn('[RadioPlayer] Live state error:', err);
        }
      }
    },

    playTrack(track) {
      if (!track || !track.url) return;
      this.currentTrack = {
        ...this.currentTrack,
        ...track,
      };
      this.isLiveStream = Boolean(track.isLive);
      this.audio.src = track.url;
      this.audio.play().catch((err) => {
        console.warn('[RadioPlayer] Auto-play blocked or stream error:', err);
      });
      this.showPlayerBar();
      this.updateUI();
    },

    togglePlay() {
      if (!this.audio.src || this.audio.src === window.location.href) {
        this.audio.src = this.currentTrack.url;
      }

      if (this.isPlaying) {
        this.audio.pause();
      } else {
        this.audio.play().catch((err) => {
          console.warn('[RadioPlayer] Play failed:', err);
          if (window.showToast) window.showToast('Could not start playback. Please verify stream.');
        });
      }
    },

    setVolume(vol) {
      this.volume = Math.max(0, Math.min(1, vol));
      if (this.audio) this.audio.volume = this.volume;
    },

    onPlayStateChange(playing) {
      this.isPlaying = playing;
      this.updateUI();
    },

    onEnded() {
      this.isPlaying = false;
      this.updateUI();
    },

    onError(e) {
      this.isPlaying = false;
      this.updateUI();
      console.warn('[RadioPlayer] Playback error encountered:', e);
    },

    updateTimeProgress() {
      if (this.isLiveStream) return;
      const current = this.audio.currentTime || 0;
      const total = this.audio.duration || 0;
      const progressEl = document.getElementById('player-progress-bar');
      const timeEl = document.getElementById('player-time-display');

      if (progressEl && total > 0) {
        progressEl.style.width = `${(current / total) * 100}%`;
      }
      if (timeEl && window.RadioUtils) {
        timeEl.textContent = `${window.RadioUtils.formatTime(current)} / ${window.RadioUtils.formatTime(total)}`;
      }
    },

    updateUI() {
      // Toggle play/pause buttons
      const playIcons = document.querySelectorAll('.player-play-icon');
      playIcons.forEach((el) => {
        el.textContent = this.isPlaying ? 'pause' : 'play_arrow';
      });

      // Update titles
      const titleEl = document.getElementById('current-playing-title');
      const artistEl = document.getElementById('current-playing-artist');
      const coverEl = document.getElementById('current-playing-cover');

      if (titleEl) titleEl.textContent = this.currentTrack.title;
      if (artistEl) artistEl.textContent = this.currentTrack.artist;
      if (coverEl && this.currentTrack.cover) coverEl.src = this.currentTrack.cover;

      // Hero Live Button
      const heroPlayBtn = document.getElementById('hero-play-btn');
      if (heroPlayBtn) {
        heroPlayBtn.innerHTML = this.isPlaying
          ? `<span class="material-symbols-outlined text-2xl">pause</span> Pause Live Radio`
          : `<span class="material-symbols-outlined text-2xl">play_arrow</span> Listen Live`;
      }
    },

    showPlayerBar() {
      const playerBar = document.getElementById('global-audio-player');
      if (playerBar) {
        playerBar.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
        playerBar.classList.add('opacity-100', 'translate-y-0');
      }
    },

    bindControls() {
      const heroBtn = document.getElementById('hero-play-btn');
      if (heroBtn) {
        heroBtn.addEventListener('click', () => {
          this.isLiveStream = true;
          this.togglePlay();
          this.showPlayerBar();
        });
      }

      const globalPlayBtn = document.getElementById('global-player-toggle');
      if (globalPlayBtn) {
        globalPlayBtn.addEventListener('click', () => this.togglePlay());
      }

      const volSlider = document.getElementById('player-volume-slider');
      if (volSlider) {
        volSlider.addEventListener('input', (e) => {
          this.setVolume(parseFloat(e.target.value) / 100);
        });
      }
    },
  };
})();
