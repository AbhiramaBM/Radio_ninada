// Real HTML5 Audio Engine & Global Media Controller
window.RadioPlayer = {
    audio: null,
    isPlaying: false,
    isDismissed: false,
    isMinimized: false,
    liveConfigPromise: null,
    liveStreamReady: false,
    currentTrack: {
        url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
        title: 'Radio Ninada 90.4 FM Live',
        artist: 'RJ Ananya • Ninada Morning Buzz (SDM Ujire)',
        cover: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
        isLive: true
    },
    volume: 0.8,

    init: function () {
        if (!this.audio) {
            this.audio = new Audio();
            this.audio.preload = 'none';
            this.audio.volume = this.volume;

            this.audio.addEventListener('play', () => this.onPlayStateChange(true));
            this.audio.addEventListener('pause', () => this.onPlayStateChange(false));
            this.audio.addEventListener('ended', () => this.onPlayStateChange(false));
            this.audio.addEventListener('timeupdate', () => this.updateTimeProgress());
            this.audio.addEventListener('error', () => {
                this.isPlaying = false;
                this.updateUI();
                showToast('The audio stream could not be played. Please try again shortly.');
            });
        }
        this.liveConfigPromise = this.liveConfigPromise || this.loadLiveConfig();
        return this.liveConfigPromise;
    },

    loadLiveConfig: async function () {
        const defaultStream = 'https://stream.zeno.fm/f3wvbbqmdg8uv';
        if (window.RadioNinadaAPI && typeof window.RadioNinadaAPI.getLiveState === 'function') {
            try {
                const liveRes = await window.RadioNinadaAPI.getLiveState();
                if (liveRes && liveRes.success && liveRes.data) {
                    const data = liveRes.data;
                    const validUrl = this.isValidLiveStreamUrl(data.streamUrl) ? data.streamUrl : defaultStream;
                    this.liveStreamReady = true;
                    this.currentTrack.url = validUrl;
                    if (data.title) this.currentTrack.title = data.title;
                    if (data.currentRJ || data.currentProgram) {
                        this.currentTrack.artist = `${data.currentRJ || 'RJ Ananya'} • ${data.currentProgram || 'Ninada Morning Buzz'}`;
                    }
                    this.updateUI();
                    return;
                }
            } catch (err) {
                console.warn('[RadioPlayer] Error fetching live config:', err);
            }
        }
        this.liveStreamReady = true;
        this.currentTrack.title = 'Radio Ninada 90.4 FM Live';
        this.currentTrack.artist = 'RJ Ananya • Ninada Morning Buzz (SDM Ujire)';
        this.currentTrack.url = defaultStream;
        this.updateUI();
    },

    isValidLiveStreamUrl: function (url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const parsed = new URL(url);
            return /^https?:$/.test(parsed.protocol);
        } catch (_) {
            return false;
        }
    },

    minimizeAudioPlayer: function () {
        this.isMinimized = true;
        const globalPlayer = document.getElementById('global-audio-player');
        if (globalPlayer) {
            globalPlayer.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
            globalPlayer.classList.remove('opacity-100', 'translate-y-0');
        }
        this.updateFloatingPlayer();
    },

    showAudioPlayer: function () {
        this.isDismissed = false;
        this.isMinimized = false;

        const globalPlayer = document.getElementById('global-audio-player');
        if (globalPlayer) {
            globalPlayer.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
            globalPlayer.classList.add('opacity-100', 'translate-y-0');
        }
        this.updateFloatingPlayer();
    },

    closeAudioPlayer: function () {
        this.isDismissed = true;
        this.isMinimized = false;

        if (this.audio && !this.audio.paused) {
            this.audio.pause();
        }
        this.isPlaying = false;

        const globalPlayer = document.getElementById('global-audio-player');
        if (globalPlayer) {
            globalPlayer.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
            globalPlayer.classList.remove('opacity-100', 'translate-y-0');
        }
        this.updateUI();
    },

    togglePlay: async function (url, title, artist, cover, isLive = true) {
        await this.init();
        this.showAudioPlayer();

        const streamTarget = url || this.currentTrack.url || 'https://stream.zeno.fm/f3wvbbqmdg8uv';

        if (url && url !== this.currentTrack.url) {
            this.currentTrack = {
                url: url,
                title: title || 'Radio Ninada 90.4 FM',
                artist: artist || 'Radio Ninada RJ',
                cover: cover || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
                isLive: isLive
            };
            this.audio.src = url;
        } else if (!this.audio.src || this.audio.src === '' || this.audio.src !== this.currentTrack.url) {
            this.currentTrack.url = streamTarget;
            this.audio.src = streamTarget;
        }

        if (this.audio.paused) {
            try {
                await this.audio.play();
                this.isPlaying = true;
                this.updateUI();
                showToast(`▶ Playing: ${this.currentTrack.title}`);
            } catch (err) {
                console.warn('[RadioPlayer] Stream playback error, retrying fallback stream...', err);
                const fallbackStream = 'https://stream.zeno.fm/f3wvbbqmdg8uv';
                this.currentTrack.url = fallbackStream;
                this.audio.src = fallbackStream;
                try {
                    await this.audio.play();
                    this.isPlaying = true;
                    this.updateUI();
                    showToast('▶ Streaming Radio Ninada 90.4 FM');
                } catch (fallbackErr) {
                    this.isPlaying = false;
                    this.updateUI();
                    showToast('Unable to start audio playback.');
                }
            }
        } else {
            this.audio.pause();
            this.isPlaying = false;
            this.updateUI();
            showToast('⏸ Audio Paused');
        }
    },

    playTrack: function (url, title, artist, cover) {
        this.togglePlay(url, title, artist, cover, false);
        if (window.RadioAuth && typeof window.RadioAuth.recordListeningHistory === 'function') {
            window.RadioAuth.recordListeningHistory({ title, artist, cover, url });
        }
    },

    setVolume: function (val) {
        this.volume = parseFloat(val);
        if (this.audio) this.audio.volume = this.volume;
        const volSlider = document.getElementById('global-player-vol-slider');
        if (volSlider) volSlider.value = this.volume;
    },

    seek: function (percent) {
        if (this.audio && this.audio.duration && !isNaN(this.audio.duration)) {
            this.audio.currentTime = (percent / 100) * this.audio.duration;
        }
    },

    seekRelative: function (seconds) {
        if (this.audio) {
            if (this.audio.duration && !isNaN(this.audio.duration)) {
                this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, this.audio.currentTime + seconds));
            } else {
                this.audio.currentTime = 0;
            }
        }
    },

    onPlayStateChange: function (playing) {
        this.isPlaying = playing;
        this.updateUI();
        if (playing && window.RadioAuth && typeof window.RadioAuth.recordListeningHistory === 'function') {
            window.RadioAuth.recordListeningHistory(this.currentTrack);
        }
    },

    updateUI: function () {
        const iconName = this.isPlaying ? 'pause' : 'play_arrow';

        const heroIcon = document.getElementById('hero-play-icon');
        if (heroIcon) heroIcon.innerText = iconName;

        const globalPlayIcon = document.getElementById('global-player-play-icon');
        if (globalPlayIcon) globalPlayIcon.innerText = iconName;

        const livePagePlayButtons = document.querySelectorAll('.glass-player button span.material-symbols-outlined, #live-main-play-icon');
        livePagePlayButtons.forEach(icon => {
            if (icon) icon.innerText = iconName;
        });

        document.querySelectorAll('.equalizer-bar').forEach(bar => {
            if (this.isPlaying) {
                bar.style.animationPlayState = 'running';
                bar.classList.add('active');
            } else {
                bar.style.animationPlayState = 'paused';
                bar.classList.remove('active');
            }
        });

        const globalPlayer = document.getElementById('global-audio-player');
        if (globalPlayer && !this.isDismissed && !this.isMinimized && this.currentTrack.title) {
            globalPlayer.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
            globalPlayer.classList.add('opacity-100', 'translate-y-0');
        }

        const titleEl = document.getElementById('global-player-title');
        if (titleEl) titleEl.innerText = this.currentTrack.title;

        const artistEl = document.getElementById('global-player-artist');
        if (artistEl) artistEl.innerText = this.currentTrack.artist;

        const coverEl = document.getElementById('global-player-cover');
        if (coverEl && this.currentTrack.cover) coverEl.src = this.currentTrack.cover;

        const badgeEl = document.getElementById('global-player-badge');
        if (badgeEl) {
            badgeEl.innerText = this.currentTrack.isLive ? 'LIVE' : 'PODCAST';
            if (this.currentTrack.isLive) {
                badgeEl.className = 'bg-primary/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider';
            } else {
                badgeEl.className = 'bg-surface-container text-primary font-bold text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider';
            }
        }

        this.updateFloatingPlayer();

        document.querySelectorAll('[data-live-title]').forEach((element) => {
            element.textContent = this.currentTrack.title;
        });
        document.querySelectorAll('[data-live-description]').forEach((element) => {
            element.textContent = this.currentTrack.artist;
        });
    },

    updateFloatingPlayer: function () {
        const floatingPlayer = document.getElementById('floating-radio-player');
        if (!floatingPlayer) return;

        const shouldShow = this.isMinimized && !this.isDismissed;
        floatingPlayer.classList.toggle('is-visible', shouldShow);
        floatingPlayer.classList.toggle('is-playing', this.isPlaying);
        floatingPlayer.setAttribute('aria-hidden', String(!shouldShow));
        floatingPlayer.tabIndex = shouldShow ? 0 : -1;
    },

    updateTimeProgress: function () {
        if (!this.audio) return;
        const curTime = this.audio.currentTime || 0;
        const dur = this.audio.duration || 0;

        const curTimeStr = this.formatTime(curTime);
        const durStr = (!isNaN(dur) && dur > 0) ? this.formatTime(dur) : 'LIVE';

        const timeCurEl = document.getElementById('global-player-time-current');
        const timeDurEl = document.getElementById('global-player-time-duration');
        const sliderEl = document.getElementById('global-player-progress-slider');

        if (timeCurEl) timeCurEl.innerText = curTimeStr;
        if (timeDurEl) timeDurEl.innerText = durStr;
        if (sliderEl && dur > 0) {
            sliderEl.value = (curTime / dur) * 100;
        }

        const liveProgressBar = document.querySelector('.glass-player .bg-primary');
        if (liveProgressBar && dur > 0) {
            liveProgressBar.style.width = `${(curTime / dur) * 100}%`;
        }
    },

    formatTime: function (secs) {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    }
};

function hideAudioPlayer() {
    RadioPlayer.minimizeAudioPlayer();
}

function showAudioPlayer() {
    RadioPlayer.showAudioPlayer();
}

function closePlayer() {
    RadioPlayer.closeAudioPlayer();
}

function minimizeAudioPlayer() {
    RadioPlayer.minimizeAudioPlayer();
}

function closeAudioPlayer() {
    RadioPlayer.closeAudioPlayer();
}

function toggleAudioPlay() {
    RadioPlayer.togglePlay();
}

// Toast Notification Utility
function showToast(msg) {
    const toast = document.getElementById('toast-alert');
    const toastMsg = document.getElementById('toast-msg');
    if (!toast || !toastMsg) return;
    toastMsg.innerText = msg;
    toast.classList.remove('translate-x-full', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
    }, 3000);
}

function rsvpToast(eventName) {
    showToast(`🎉 Registered for ${eventName}! Pass details sent.`);
}

// Podcast Category Filtering
function filterPodcasts(category, btn) {
    document.querySelectorAll('.podcast-filter-btn').forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary');
        b.classList.add('bg-white', 'text-on-surface-variant');
    });
    btn.classList.remove('bg-white', 'text-on-surface-variant');
    btn.classList.add('bg-primary', 'text-on-primary');

    const cards = document.querySelectorAll('.podcast-card');
    cards.forEach(card => {
        if (category === 'all' || card.classList.contains(category)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// News Data & Category Switching (Strictly fetched from Admin API)
const newsData = {
    college: [],
    local: [],
    karnataka: [],
    india: [],
    international: []
};

function normalizeNewsCategory(catStr) {
    if (!catStr) return 'local';
    const lower = catStr.toLowerCase().trim();
    if (lower.includes('college') || lower.includes('campus')) return 'college';
    if (lower.includes('local') || lower.includes('city')) return 'local';
    if (lower.includes('karnataka') || lower.includes('state')) return 'karnataka';
    if (lower.includes('national') || lower.includes('india')) return 'india';
    if (lower.includes('international') || lower.includes('global') || lower.includes('world')) return 'international';
    return 'local';
}

function renderNews(category) {
    const container = document.getElementById('news-container');
    if (!container) return;
    const items = newsData[category] || [];
    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-12 text-center text-on-surface-variant italic font-body-md border border-dashed border-outline-variant/40 rounded-2xl">
                No news bulletins published in this category yet. Check back soon for updates from our newsroom!
            </div>
        `;
        return;
    }
    container.innerHTML = items.map(item => {
        const safeTitle = (item.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeTag = (item.tag || 'News').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeDate = (item.date || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeDesc = (item.desc || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeImage = (item.image || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

        return `
            <div class="bg-white rounded-2xl p-md border border-outline-variant/30 hover:shadow-xl transition-all flex flex-col justify-between group">
                <div>
                    <div class="flex justify-between items-center mb-xs">
                        <span class="bg-surface-container text-primary font-bold text-[10px] px-sm py-0.5 rounded-full uppercase">${item.tag}</span>
                        <span class="text-xs text-on-surface-variant">${item.date}</span>
                    </div>
                    <h3 class="font-headline-md text-[18px] font-bold leading-snug mb-xs group-hover:text-primary transition-colors">${item.title}</h3>
                    <p class="text-on-surface-variant text-sm line-clamp-3">${item.desc}</p>
                </div>
                <div onclick="openNewsArticleModal('${safeTitle}', '${safeTag}', '${safeDate}', '${safeDesc}', '${safeImage}')"
                    class="mt-md pt-sm border-t border-outline-variant/20 flex justify-between items-center text-xs text-primary font-bold cursor-pointer group-hover:translate-x-1 transition-transform">
                    <span>Read Full Bulletin</span>
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
            </div>
        `;
    }).join('');
}

function openNewsArticleModal(title, category, date, content, image) {
    const modal = document.getElementById('news-modal');
    if (!modal) return;

    const titleEl = document.getElementById('news-modal-title');
    const tagEl = document.getElementById('news-modal-tag');
    const dateEl = document.getElementById('news-modal-date');
    const contentEl = document.getElementById('news-modal-content');
    const imgEl = document.getElementById('news-modal-img');

    if (titleEl) titleEl.innerText = title;
    if (tagEl) tagEl.innerText = category;
    if (dateEl) dateEl.innerText = date;
    if (contentEl) contentEl.innerText = content;

    if (imgEl) {
        if (image) {
            imgEl.src = image;
            imgEl.classList.remove('hidden');
        } else {
            imgEl.classList.add('hidden');
        }
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeNewsModal() {
    const modal = document.getElementById('news-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function switchNewsTab(cat, btn) {
    document.querySelectorAll('#news .tab-btn').forEach(b => {
        b.classList.remove('active', 'bg-primary', 'text-white');
        b.classList.add('bg-white', 'text-on-surface-variant');
    });
    btn.classList.add('active', 'bg-primary', 'text-white');
    btn.classList.remove('bg-white', 'text-on-surface-variant');
    renderNews(cat);
}

// RJ Data & Modal Handler
const rjData = {
    rj1: {
        name: "RJ Ananya",
        show: "Ninada Morning Buzz",
        timing: "Mon - Fri • 07:00 AM - 09:00 AM",
        img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        bio: "Ananya brings 5+ years of prime-time radio hosting experience, waking up the city with energetic tunes, local stories, and community banter.",
        genre: "Pop, Folk Fusion, Morning Melodies"
    },
    rj2: {
        name: "RJ Vikram",
        show: "Campus Beats & Tech Byte",
        timing: "Mon, Wed, Fri • 05:00 PM - 06:30 PM",
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        bio: "Vikram spotlights indie rock, college fest stories, tech trends, and campus startup pioneers.",
        genre: "Indie Rock, Tech Discussions, Youth Beats"
    }
};

function openRjModal(id) {
    const data = rjData[id];
    if (!data) return;
    document.getElementById('modal-rj-img').src = data.img;
    document.getElementById('modal-rj-name').innerText = data.name;
    document.getElementById('modal-rj-show').innerText = data.show;
    document.getElementById('modal-rj-timing').innerText = data.timing;
    document.getElementById('modal-rj-bio').innerText = data.bio;
    document.getElementById('modal-rj-genre').innerText = data.genre;

    const modal = document.getElementById('rj-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeRjModal() {
    const modal = document.getElementById('rj-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Media Gallery Filtering
function filterGallery(type, btn) {
    document.querySelectorAll('.gallery-btn').forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary');
        b.classList.add('bg-white', 'text-on-surface-variant');
    });
    btn.classList.remove('bg-white', 'text-on-surface-variant');
    btn.classList.add('bg-primary', 'text-on-primary');

    const items = document.querySelectorAll('.gallery-item');
    items.forEach(item => {
        if (type === 'all' || item.classList.contains(type)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function openMediaPreview(title, kind, rawUrl, desc) {
    const modal = document.getElementById('media-lightbox-modal');
    const content = document.getElementById('media-lightbox-content');
    const titleEl = document.getElementById('media-lightbox-title');
    const iconEl = document.getElementById('media-lightbox-icon');
    const descEl = document.getElementById('media-lightbox-desc');

    if (!modal || !content) return;

    const fullUrl = resolveServerUrl(rawUrl);
    titleEl.textContent = title || 'Media Preview';
    descEl.textContent = desc || '';

    if (kind === 'video' || kind === 'VIDEO') {
        iconEl.textContent = 'videocam';
        content.innerHTML = `
            <video src="${fullUrl}" controls autoplay class="w-full h-full object-contain bg-black">
                Your browser does not support HTML5 video playback.
            </video>
        `;
    } else {
        iconEl.textContent = 'photo_camera';
        content.innerHTML = `
            <img src="${fullUrl}" alt="${title}" class="w-full h-full object-contain" />
        `;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeMediaLightbox() {
    const modal = document.getElementById('media-lightbox-modal');
    const content = document.getElementById('media-lightbox-content');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    if (content) {
        content.innerHTML = '';
    }
}

// Helper to resolve server upload URLs to absolute backend URLs
function resolveServerUrl(url) {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const origin = isLocal ? 'http://localhost:5000' : (typeof window !== 'undefined' && window.location ? window.location.origin : '');
        return origin + url;
    }
    return url;
}

// Periodic Live Broadcast Sync
function initRealtimeListeners() {
    // Sync live state periodically every 30 seconds
    setInterval(async () => {
        if (window.RadioPlayer && typeof window.RadioPlayer.loadLiveConfig === 'function') {
            await window.RadioPlayer.loadLiveConfig();
        }
    }, 30000);
}

function renderRJsUI(rjList) {
    const container = document.getElementById('rj-list-container');
    if (!container) return;
    for (const k in rjData) {
        if (k.startsWith('dyn_')) delete rjData[k];
    }
    
    // If database returned hosts, render them
    if (Array.isArray(rjList) && rjList.length > 0) {
        container.innerHTML = rjList.map(rj => {
            const rjKey = 'dyn_' + rj.id;
            const photoUrl = resolveServerUrl(rj.photo || rj.photoUrl) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80';
            rjData[rjKey] = {
                name: rj.name,
                show: rj.designation || 'On-Air Host',
                timing: rj.status === 'ACTIVE' ? 'On Air Active' : 'Station Host',
                img: photoUrl,
                bio: rj.bio || 'Station Presenter at Radio Ninada 90.4 FM.',
                genre: rj.achievements || 'Pop, Classical, Regional Beats'
            };
            return `
                <div onclick="openRjModal('${rjKey}')" class="flex flex-col items-center group cursor-pointer shrink-0 w-28 text-center">
                    <div class="w-20 h-20 rounded-full p-1 border-2 border-primary/40 group-hover:border-primary group-hover:scale-110 transition-all shadow-md overflow-hidden bg-white mb-xs">
                        <img class="w-full h-full object-cover rounded-full" src="${photoUrl}" alt="${rj.name}" />
                    </div>
                    <span class="font-bold text-sm text-on-background group-hover:text-primary transition-colors leading-tight truncate w-full">${rj.name}</span>
                    <span class="text-[11px] text-on-surface-variant truncate w-full">${rj.designation || 'Host'}</span>
                </div>
            `;
        }).join('');
        return;
    }

    // Default station RJs fallback
    const defaultRJs = [
        { key: 'rj1', name: 'RJ Ananya', desig: 'Morning Buzz', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
        { key: 'rj2', name: 'RJ Vikram', desig: 'Campus Beats', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' }
    ];
    container.innerHTML = defaultRJs.map(rj => `
        <div onclick="openRjModal('${rj.key}')" class="flex flex-col items-center group cursor-pointer shrink-0 w-28 text-center">
            <div class="w-20 h-20 rounded-full p-1 border-2 border-primary/40 group-hover:border-primary group-hover:scale-110 transition-all shadow-md overflow-hidden bg-white mb-xs">
                <img class="w-full h-full object-cover rounded-full" src="${rj.photo}" alt="${rj.name}" />
            </div>
            <span class="font-bold text-sm text-on-background group-hover:text-primary transition-colors leading-tight truncate w-full">${rj.name}</span>
            <span class="text-[11px] text-on-surface-variant truncate w-full">${rj.desig}</span>
        </div>
    `).join('');
}

function renderPodcastsUI(podList) {
    const podGrid = document.getElementById('podcast-grid');
    if (!podGrid) return;
    if (!Array.isArray(podList) || podList.length === 0) {
        podGrid.innerHTML = `
            <div class="col-span-full py-12 text-center text-on-surface-variant italic font-body-md border border-dashed border-outline-variant/40 rounded-2xl">
                No podcast episodes published yet. Tune in soon for fresh shows or upload episodes from the admin dashboard!
            </div>
        `;
        return;
    }
    podGrid.innerHTML = podList.map((pod) => {
        const coverUrl = resolveServerUrl(pod.coverUrl) || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80';
        const audioUrl = resolveServerUrl(pod.audioUrl || (pod.episodes && pod.episodes[0]?.audioUrl)) || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        const catName = (typeof pod.category === 'object' && pod.category?.name) ? pod.category.name : (typeof pod.category === 'string' ? pod.category : 'Podcast');
        const catClass = catName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const epNum = (pod.episodes && pod.episodes[0]?.episodeNumber) || pod.episodeNumber || 1;
        const seasonNum = (pod.episodes && pod.episodes[0]?.season) || pod.season || 1;

        return `
            <div class="podcast-card popular recently-added ${catClass} bg-white rounded-2xl p-md border border-outline-variant/30 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                    <div class="relative aspect-video rounded-xl overflow-hidden mb-md">
                        <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${coverUrl}" alt="${pod.title}" />
                        <span class="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-bold px-sm py-0.5 rounded-full uppercase">${catName}</span>
                        <button onclick="RadioPlayer.playTrack('${audioUrl.replace(/'/g, "\\'")}', '${pod.title.replace(/'/g, "\\'")}', 'S${seasonNum} E${epNum}', '${coverUrl.replace(/'/g, "\\'")}')"
                            class="absolute inset-0 m-auto w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all cursor-pointer">
                            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                        </button>
                    </div>
                    <h3 class="font-headline-md text-[18px] font-bold leading-snug mb-xs group-hover:text-primary transition-colors">${pod.title}</h3>
                    <p class="text-on-surface-variant text-xs mb-sm">S${seasonNum} E${epNum} • ${pod.duration || '30:00'}</p>
                    <p class="text-on-surface-variant text-sm line-clamp-2">${pod.description || ''}</p>
                </div>
                <div class="mt-md pt-sm border-t border-outline-variant/20 flex justify-between items-center text-xs text-on-surface-variant">
                    <span>${pod.downloads || 0} Downloads</span>
                    <div class="flex items-center gap-2">
                        <button onclick="addTrackToPlaylistPrompt('${pod.title.replace(/'/g, "\\'")}', '${catName.replace(/'/g, "\\'")}', '${audioUrl.replace(/'/g, "\\'")}', '${coverUrl.replace(/'/g, "\\'")}', '${pod.duration || '30:00'}')"
                            class="text-primary hover:underline text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer" title="Add episode to playlist">
                            <span class="material-symbols-outlined text-sm">playlist_add</span>
                            <span>Add</span>
                        </button>
                        <span class="material-symbols-outlined text-sm hover:text-primary cursor-pointer" onclick="showToast('Episode bookmarked!')">bookmark</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addToCalendar(title, description, location, dateStr) {
    try {
        const startDate = dateStr ? new Date(dateStr) : new Date();
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

        const formatICSDate = (date) => {
            return date.toISOString().replace(/-|:|\.\d+/g, '');
        };

        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
            `&text=${encodeURIComponent(title)}` +
            `&details=${encodeURIComponent(description || '')}` +
            `&location=${encodeURIComponent(location || '')}` +
            `&dates=${formatICSDate(startDate)}/${formatICSDate(endDate)}`;

        window.open(googleUrl, '_blank', 'noopener,noreferrer');
        if (window.showToast) {
            window.showToast(`📅 Adding "${title}" to Calendar...`);
        }
    } catch (err) {
        console.error('[addToCalendar] Error:', err);
        if (window.showToast) window.showToast('Unable to open calendar.');
    }
}

function renderEventsUI(evtList) {
    const eventsContainer = document.getElementById('events-grid') || document.querySelector('#events .grid');
    if (!eventsContainer) return;

    // Use events from backend or station defaults
    const items = (Array.isArray(evtList) && evtList.length > 0) ? evtList : [
        {
            title: "Annual SDM Media Fest & Live RJ Contest",
            description: "A flagship inter-collegiate festival celebrating radio production, news reporting, voice acting, and student broadcasting talents.",
            location: "SDM Campus Auditorium, Ujire",
            eventDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            banner: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80"
        },
        {
            title: "Ninada Musical Eve - Live Classical & Folk",
            description: "An open-air evening celebrating regional Yakshagana melodies, Carnatic classical fusions, and local acoustic bands broadcast live on 90.4 FM.",
            location: "Radio Ninada Amphitheatre",
            eventDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            banner: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80"
        },
        {
            title: "Community Radio Workshop & Voice Modulation",
            description: "Interactive masterclass conducted by Senior Station RJs on audio editing, podcast storytelling, and microphone presence.",
            location: "Studio 1, SDM Campus",
            eventDate: new Date(Date.now() + 21 * 86400000).toISOString(),
            banner: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80"
        }
    ];

    eventsContainer.innerHTML = items.map(evt => {
        const bannerUrl = resolveServerUrl(evt.banner) || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80';
        const dateObj = evt.eventDate ? new Date(evt.eventDate) : null;
        const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : 'UPCOMING';
        const rawDate = evt.eventDate || new Date().toISOString();

        return `
            <div class="bg-white rounded-2xl overflow-hidden border border-outline-variant/30 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between">
                <div>
                    <div class="relative h-48 overflow-hidden">
                        <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${bannerUrl}" alt="${evt.title}" />
                        <div class="absolute top-3 right-3 bg-primary text-white font-bold text-xs px-md py-xs rounded-full shadow-md">${dateStr}</div>
                    </div>
                    <div class="p-md">
                        <div class="flex items-center gap-xs text-xs text-primary font-semibold uppercase mb-xs">
                            <span class="material-symbols-outlined text-sm">location_on</span>
                            <span>${evt.location || 'Radio Ninada Studio'}</span>
                        </div>
                        <h3 class="font-headline-md text-[20px] font-bold mb-xs group-hover:text-primary transition-colors">${evt.title}</h3>
                        <p class="text-on-surface-variant text-sm mb-md line-clamp-2">${evt.description || ''}</p>
                    </div>
                </div>
                <div class="p-md pt-0">
                    <button onclick="addToCalendar('${evt.title.replace(/'/g, "\\'")}', '${(evt.description || '').replace(/'/g, "\\'")}', '${(evt.location || 'Radio Ninada Studio').replace(/'/g, "\\'")}', '${rawDate}')"
                        class="w-full bg-surface-container-low text-primary font-bold py-sm rounded-xl hover:bg-primary hover:text-white transition-all text-sm cursor-pointer flex items-center justify-center gap-2 shadow-xs">
                        <span class="material-symbols-outlined text-lg">calendar_add_on</span>
                        <span>Add to Calendar</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderGalleryUI(galList) {
    const galGrid = document.getElementById('gallery-grid');
    if (!galGrid) return;

    // Use items from backend or station defaults
    const items = (Array.isArray(galList) && galList.length > 0) ? galList : [
        {
            title: "Studio 1 Live Broadcast Booth",
            description: "High-definition sound engineering desk and live on-air booth at SDM Ujire.",
            mediaUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80",
            type: "PHOTO",
            duration: "Studio"
        },
        {
            title: "Behind The Mic: RJ Live Banter",
            description: "Catch the spontaneous jokes and lively atmosphere between program segments.",
            mediaUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80",
            type: "PHOTO",
            duration: "On-Air"
        },
        {
            title: "Field Reporting & Village Outreach",
            description: "Radio Ninada recording folk songs and agricultural stories across Belthangady taluk.",
            mediaUrl: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=600&q=80",
            type: "PHOTO",
            duration: "Community"
        }
    ];

    galGrid.innerHTML = items.map(item => {
        const isVideo = item.type === 'VIDEO' || item.category === 'BTS Shorts' || (item.mediaUrl && item.mediaUrl.match(/\.(mp4|webm|mov|mkv)$/i));
        const itemClass = isVideo ? 'bts' : 'photos';
        const displayThumb = resolveServerUrl(item.thumbnail || item.mediaUrl);
        const durationTag = item.duration || (isVideo ? 'Shorts' : 'Photo');
        const desc = item.description || (isVideo ? 'Watch studio bloopers & Behind the mic moments' : 'Behind the mic photo');

        return `
            <div class="gallery-item ${itemClass} relative rounded-2xl overflow-hidden group shadow-md aspect-video cursor-pointer"
                onclick="openMediaPreview('${item.title.replace(/'/g, "\\'")}', '${isVideo ? 'video' : 'photo'}', '${item.mediaUrl.replace(/'/g, "\\'")}', '${desc.replace(/'/g, "\\'")}')">
                <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="${displayThumb}" alt="${item.title}" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-md flex flex-col justify-between">
                    <span class="self-end bg-primary/90 text-white text-[10px] font-bold px-sm py-0.5 rounded-full flex items-center gap-xs">
                        <span class="material-symbols-outlined text-xs">${isVideo ? 'videocam' : 'photo_camera'}</span>
                        ${durationTag}
                    </span>
                    <div>
                        <h4 class="text-white font-bold text-sm mb-xs group-hover:text-primary transition-colors">${item.title}</h4>
                        <p class="text-white/70 text-xs line-clamp-1">${desc}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderNewsUI(newsItems) {
    if (!Array.isArray(newsItems) || newsItems.length === 0) {
        // Retain default rich fallback news items
        const activeTabBtn = document.querySelector('#news .tab-btn.active');
        const activeCategory = activeTabBtn ? activeTabBtn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || 'college' : 'college';
        renderNews(activeCategory);
        return;
    }

    newsData.college = [];
    newsData.local = [];
    newsData.karnataka = [];
    newsData.india = [];
    newsData.international = [];

    newsItems.forEach(item => {
        const catKey = normalizeNewsCategory(item.category);
        const coverImage = resolveServerUrl(item.featuredImage) || '';
        const formattedItem = {
            title: item.title,
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            desc: item.content || item.description || '',
            tag: item.category || 'News',
            image: coverImage,
        };
        if (newsData[catKey]) {
            newsData[catKey].push(formattedItem);
        } else {
            newsData.college.push(formattedItem);
        }
    });

    // Default tab to active or college
    const activeTabBtn = document.querySelector('#news .tab-btn.active');
    const activeCategory = activeTabBtn ? activeTabBtn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || 'college' : 'college';
    renderNews(activeCategory);
}

function renderScheduleUI(scheduleList = [], programList = []) {
    const scheduleContainer = document.getElementById('schedule-grid') || document.querySelector('#schedule .grid');
    if (!scheduleContainer) return;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Case 1: Specific Timetable Schedule Slots exist
    if (Array.isArray(scheduleList) && scheduleList.length > 0) {
        let todaySlots = scheduleList.filter(s => s.dayOfWeek === currentDay);
        if (todaySlots.length === 0) todaySlots = scheduleList;

        scheduleContainer.innerHTML = todaySlots.map(slot => {
            const title = slot.program?.name || 'Radio Show';
            const host = slot.program?.hostName || 'RJ Host';
            const category = slot.program?.category || 'Music';
            const startTime = slot.startTime || '00:00';
            const endTime = slot.endTime || '00:00';
            const imgUrl = resolveServerUrl(slot.program?.thumbnail || slot.program?.banner) || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80';
            const isLiveNow = (slot.dayOfWeek === currentDay) && (currentTimeStr >= startTime && currentTimeStr <= endTime);

            return `
                <div class="bg-white rounded-2xl p-md ${isLiveNow ? 'active-glow scale-105 z-10 shadow-lg' : 'hover:shadow-xl'} border border-outline-variant/30 transition-all flex gap-md relative">
                    <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden relative">
                        <img class="w-full h-full object-cover" src="${imgUrl}" alt="${title}" />
                        ${isLiveNow ? '<div class="absolute inset-0 bg-primary/20 animate-pulse"></div>' : ''}
                    </div>
                    <div class="flex-grow min-w-0">
                        <div class="flex justify-between items-start">
                            <span class="text-primary font-bold font-label-sm text-[12px] block mb-xs">${startTime} - ${endTime}</span>
                            ${isLiveNow ? '<span class="material-symbols-outlined text-primary text-[18px] animate-bounce">graphic_eq</span>' : ''}
                        </div>
                        <h3 class="font-headline-md text-[18px] font-bold leading-tight mb-xs truncate">${title}</h3>
                        <p class="text-on-surface-variant text-[14px] truncate">${host}</p>
                        <span class="mt-base inline-block bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full text-[10px] font-bold uppercase">${category}</span>
                    </div>
                </div>
            `;
        }).join('');
        return;
    }

    // Case 2: Programs from Database exist (created by admin)
    if (Array.isArray(programList) && programList.length > 0) {
        scheduleContainer.innerHTML = programList.map((prog, idx) => {
            const title = prog.name || 'Station Show';
            const host = prog.hostName || prog.host?.name || 'RJ Presenter';
            const category = prog.categoryName || prog.category?.name || 'Community';
            const scheduleTime = prog.schedule || 'Daily • 08:00 AM - 09:00 AM';
            const imgUrl = resolveServerUrl(prog.thumbnail || prog.banner) || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80';
            const isFeatured = idx === 0;

            return `
                <div class="bg-white rounded-2xl p-md ${isFeatured ? 'active-glow z-10 shadow-lg' : 'hover:shadow-xl'} border border-outline-variant/30 transition-all flex gap-md relative">
                    <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden relative">
                        <img class="w-full h-full object-cover" src="${imgUrl}" alt="${title}" />
                        ${isFeatured ? '<div class="absolute inset-0 bg-primary/20 animate-pulse"></div>' : ''}
                    </div>
                    <div class="flex-grow min-w-0">
                        <div class="flex justify-between items-start">
                            <span class="text-primary font-bold font-label-sm text-[12px] block mb-xs">${scheduleTime}</span>
                            ${isFeatured ? '<span class="material-symbols-outlined text-primary text-[18px] animate-bounce">graphic_eq</span>' : ''}
                        </div>
                        <h3 class="font-headline-md text-[18px] font-bold leading-tight mb-xs truncate">${title}</h3>
                        <p class="text-on-surface-variant text-[14px] truncate">${host}</p>
                        <span class="mt-base inline-block bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full text-[10px] font-bold uppercase">${category}</span>
                    </div>
                </div>
            `;
        }).join('');
        return;
    }

    // Case 3: Default station schedule showcase
    const defaultShows = [
        { time: "07:00 AM - 09:00 AM", title: "Ninada Morning Buzz", host: "RJ Ananya", cat: "Morning Vibes", img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80" },
        { time: "12:00 PM - 01:30 PM", title: "Campus Pulse & SDM News", host: "Student Media Team", cat: "Talk Show", img: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80" },
        { time: "05:00 PM - 06:30 PM", title: "Youth Junction & Beats", host: "RJ Vikram", cat: "Indie Beats", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80" }
    ];

    scheduleContainer.innerHTML = defaultShows.map((s, i) => `
        <div class="bg-white rounded-2xl p-md ${i === 0 ? 'active-glow shadow-md' : 'hover:shadow-xl'} border border-outline-variant/30 transition-all flex gap-md relative">
            <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden relative">
                <img class="w-full h-full object-cover" src="${s.img}" alt="${s.title}" />
            </div>
            <div class="flex-grow min-w-0">
                <span class="text-primary font-bold font-label-sm text-[12px] block mb-xs">${s.time}</span>
                <h3 class="font-headline-md text-[18px] font-bold leading-tight mb-xs truncate">${s.title}</h3>
                <p class="text-on-surface-variant text-[14px] truncate">${s.host}</p>
                <span class="mt-base inline-block bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full text-[10px] font-bold uppercase">${s.cat}</span>
            </div>
        </div>
    `).join('');
}

// Global Dynamic Data Synchronizer
async function loadDynamicData() {
    if (!window.RadioNinadaAPI) return;

    try {
        const [schedRes, progRes] = await Promise.all([
            window.RadioNinadaAPI.getSchedule().catch(e => ({ success: false, data: [] })),
            window.RadioNinadaAPI.getPrograms().catch(e => ({ success: false, data: [] }))
        ]);
        const schedData = (schedRes && schedRes.success && Array.isArray(schedRes.data)) ? schedRes.data : [];
        const progData = (progRes && progRes.success && Array.isArray(progRes.data)) ? progRes.data : [];
        renderScheduleUI(schedData, progData);
    } catch (e) {
        console.warn('[loadDynamicData] Schedule/Programs fetch fallback:', e);
        renderScheduleUI([], []);
    }

    try {
        const rjRes = await window.RadioNinadaAPI.getRJs();
        if (rjRes && rjRes.success && Array.isArray(rjRes.data)) {
            renderRJsUI(rjRes.data);
        } else {
            renderRJsUI([]);
        }
    } catch (e) {
        console.warn('[loadDynamicData] RJs fetch fallback:', e);
        renderRJsUI([]);
    }

    try {
        const podRes = await window.RadioNinadaAPI.getPodcasts();
        if (podRes && podRes.success && Array.isArray(podRes.data)) {
            renderPodcastsUI(podRes.data);
        }
    } catch (e) { console.warn('[loadDynamicData] Podcasts fetch fallback:', e); }

    try {
        const newsRes = await window.RadioNinadaAPI.getNews();
        if (newsRes && newsRes.success && Array.isArray(newsRes.data)) {
            renderNewsUI(newsRes.data);
        }
    } catch (e) { console.warn('[loadDynamicData] News fetch fallback:', e); }

    try {
        const evtRes = await window.RadioNinadaAPI.getEvents();
        if (evtRes && evtRes.success && Array.isArray(evtRes.data)) {
            renderEventsUI(evtRes.data);
        } else {
            renderEventsUI([]);
        }
    } catch (e) {
        console.warn('[loadDynamicData] Events fetch fallback:', e);
        renderEventsUI([]);
    }

    try {
        const galRes = await window.RadioNinadaAPI.getGallery();
        if (galRes && galRes.success && Array.isArray(galRes.data)) {
            renderGalleryUI(galRes.data);
        } else {
            renderGalleryUI([]);
        }
    } catch (e) {
        console.warn('[loadDynamicData] Gallery fetch fallback:', e);
        renderGalleryUI([]);
    }

    // Fetch initial notifications and playlists
    fetchAndRenderNotifications();
    fetchAndRenderPlaylists();
}

// Global Event Listeners & Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Radio Ninada 90.4 FM Live Stream Player & Config
    if (window.RadioPlayer && typeof window.RadioPlayer.init === 'function') {
        window.RadioPlayer.init();
    }
    if (window.RadioMediaLibrary && typeof window.RadioMediaLibrary.init === 'function') {
        window.RadioMediaLibrary.init();
    }

    // Initial render of college news
    renderNews('college');

    // Fetch dynamic backend data
    loadDynamicData();

    // Close modals when clicking backdrop
    window.addEventListener('click', (e) => {
        const rjModal = document.getElementById('rj-modal');
        if (e.target === rjModal) {
            closeRjModal();
        }
        const mediaModal = document.getElementById('media-lightbox-modal');
        if (e.target === mediaModal) {
            closeMediaLightbox();
        }
        const searchModal = document.getElementById('global-search-modal');
        if (e.target === searchModal) {
            closeGlobalSearchModal();
        }
        const playlistModal = document.getElementById('playlist-modal');
        if (e.target === playlistModal) {
            closePlaylistModal();
        }
        const newsModal = document.getElementById('news-modal');
        if (e.target === newsModal) {
            closeNewsModal();
        }
        const notifPanel = document.getElementById('notification-panel');
        const notifBtn = document.getElementById('notification-btn');
        if (notifPanel && !notifPanel.contains(e.target) && notifBtn && !notifBtn.contains(e.target)) {
            closeNotificationPanel();
        }
    });
});

// Phase 10: Global Search Functionality
function openGlobalSearchModal() {
    const modal = document.getElementById('global-search-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        const input = document.getElementById('global-search-input');
        if (input) {
            input.value = '';
            input.focus();
        }
        performGlobalSearch();
    }
}

function closeGlobalSearchModal() {
    const modal = document.getElementById('global-search-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function performGlobalSearch() {
    const input = document.getElementById('global-search-input');
    const container = document.getElementById('global-search-results');
    if (!container) return;

    const query = input ? input.value.trim().toLowerCase() : '';
    if (!query) {
        container.innerHTML = `<p class="text-xs text-center text-gray-400 py-6">Type keywords above to search live Radio Ninada content...</p>`;
        return;
    }

    container.innerHTML = `<p class="text-xs text-center text-primary py-6 flex items-center justify-center gap-2"><span class="material-symbols-outlined animate-spin text-sm">sync</span> Searching live catalog...</p>`;

    const results = [];

    // Search Podcasts
    if (window.RadioNinadaAPI) {
        try {
            const pods = await window.RadioNinadaAPI.getPodcasts();
            if (pods && pods.success && Array.isArray(pods.data)) {
                pods.data.forEach(p => {
                    if (p.title.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query))) {
                        results.push({ type: 'PODCAST', title: p.title, subtitle: `Podcast • ${p.category || 'Audio'}`, icon: 'podcasts', action: `RadioPlayer.playTrack('${p.audioUrl}', '${p.title}', 'Podcast', '${p.coverUrl || ''}'); closeGlobalSearchModal();` });
                    }
                });
            }
        } catch (_) {}

        // Search News
        try {
            const newsRes = await window.RadioNinadaAPI.getNews();
            if (newsRes && newsRes.success && Array.isArray(newsRes.data)) {
                newsRes.data.forEach(n => {
                    if (n.title.toLowerCase().includes(query) || (n.content && n.content.toLowerCase().includes(query))) {
                        results.push({ type: 'NEWS', title: n.title, subtitle: `News Bulletin • ${n.category || 'Local'}`, icon: 'newspaper', action: `document.getElementById('news').scrollIntoView({behavior:'smooth'}); closeGlobalSearchModal();` });
                    }
                });
            }
        } catch (_) {}

        // Search Events
        try {
            const evts = await window.RadioNinadaAPI.getEvents();
            if (evts && evts.success && Array.isArray(evts.data)) {
                evts.data.forEach(e => {
                    if (e.title.toLowerCase().includes(query) || (e.description && e.description.toLowerCase().includes(query))) {
                        results.push({ type: 'EVENT', title: e.title, subtitle: `Event • ${e.location || 'Radio Studio'}`, icon: 'event', action: `document.getElementById('events').scrollIntoView({behavior:'smooth'}); closeGlobalSearchModal();` });
                    }
                });
            }
        } catch (_) {}

        // Search RJs
        try {
            const rjs = await window.RadioNinadaAPI.getRJs();
            if (rjs && rjs.success && Array.isArray(rjs.data)) {
                rjs.data.forEach(r => {
                    if (r.name.toLowerCase().includes(query) || (r.bio && r.bio.toLowerCase().includes(query))) {
                        results.push({ type: 'RJ', title: r.name, subtitle: `RJ Host • ${r.designation || 'Presenter'}`, icon: 'mic', action: `document.getElementById('rj-team').scrollIntoView({behavior:'smooth'}); closeGlobalSearchModal();` });
                    }
                });
            }
        } catch (_) {}
    }

    if (results.length === 0) {
        container.innerHTML = `<p class="text-xs text-center text-gray-500 py-6">No matching broadcasts, podcasts, or events found for "${query}".</p>`;
        return;
    }

    container.innerHTML = results.map(item => `
        <div onclick="${item.action}" class="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-2xl cursor-pointer transition-all flex items-center justify-between group">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-xl">${item.icon}</span>
                </div>
                <div>
                    <p class="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors">${item.title}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${item.subtitle}</p>
                </div>
            </div>
            <span class="material-symbols-outlined text-gray-400 text-sm group-hover:translate-x-1 transition-transform">chevron_right</span>
        </div>
    `).join('');
}

// ==========================================
// Phase 11: Real Notifications System Implementation
// ==========================================
let notificationItems = [];

async function fetchAndRenderNotifications() {
    const listEl = document.getElementById('notification-list');
    const badgeEl = document.getElementById('unread-notification-badge');
    if (!listEl) return;

    if (!window.RadioNinadaAPI || typeof window.RadioNinadaAPI.getNotifications !== 'function') {
        listEl.innerHTML = `<div class="p-6 text-center text-gray-400 text-xs">Notifications API unavailable</div>`;
        return;
    }

    try {
        const res = await window.RadioNinadaAPI.getNotifications();
        if (res && res.success && Array.isArray(res.data)) {
            notificationItems = res.data;
            const unreadCount = notificationItems.filter(n => !n.isRead).length;

            if (badgeEl) {
                if (unreadCount > 0) {
                    badgeEl.innerText = unreadCount > 9 ? '9+' : unreadCount;
                    badgeEl.classList.remove('hidden');
                } else {
                    badgeEl.classList.add('hidden');
                }
            }

            if (notificationItems.length === 0) {
                listEl.innerHTML = `
                    <div class="p-8 text-center text-gray-400 text-xs space-y-2">
                        <span class="material-symbols-outlined text-3xl text-gray-300">notifications_off</span>
                        <p class="font-medium text-gray-600 dark:text-gray-400">No notifications yet</p>
                        <p class="text-[11px]">Station announcements and live event alerts will appear here.</p>
                    </div>
                `;
                return;
            }

            listEl.innerHTML = notificationItems.map(n => {
                const timeStr = n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const isUnread = !n.isRead;
                return `
                    <div class="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-start justify-between gap-3 ${isUnread ? 'bg-primary/5' : ''}">
                        <div class="space-y-0.5 flex-1">
                            <div class="flex items-center gap-2">
                                ${isUnread ? '<span class="w-2 h-2 rounded-full bg-primary shrink-0"></span>' : ''}
                                <h4 class="font-bold text-xs text-gray-900 dark:text-white">${n.title}</h4>
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">${n.message}</p>
                            <p class="text-[10px] text-gray-400 font-medium">${timeStr}</p>
                        </div>
                        ${isUnread ? `
                            <button onclick="markNotificationAsRead('${n.id}')"
                                class="text-[11px] font-semibold text-primary hover:underline shrink-0 cursor-pointer">Read</button>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } else {
            listEl.innerHTML = `<div class="p-6 text-center text-gray-400 text-xs">Failed to load notifications.</div>`;
        }
    } catch (err) {
        console.warn('[Notifications] Error fetching:', err);
        listEl.innerHTML = `<div class="p-6 text-center text-red-400 text-xs">Error connecting to notifications server.</div>`;
    }
}

function toggleNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        fetchAndRenderNotifications();
    } else {
        panel.classList.add('hidden');
    }
}

function closeNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (panel) panel.classList.add('hidden');
}

async function markNotificationAsRead(id) {
    if (window.RadioNinadaAPI && typeof window.RadioNinadaAPI.markNotificationRead === 'function') {
        await window.RadioNinadaAPI.markNotificationRead(id);
        fetchAndRenderNotifications();
    }
}

async function markAllNotificationsAsRead() {
    if (window.RadioNinadaAPI && typeof window.RadioNinadaAPI.markAllNotificationsRead === 'function') {
        await window.RadioNinadaAPI.markAllNotificationsRead();
        fetchAndRenderNotifications();
        showToast('All notifications marked as read');
    }
}

// ==========================================
// Phase 12: Real Playlists System Implementation
// ==========================================
let userPlaylists = [];
let activePlaylistId = null;

async function fetchAndRenderPlaylists() {
    if (!window.RadioNinadaAPI || typeof window.RadioNinadaAPI.getPlaylists !== 'function') return;

    try {
        const res = await window.RadioNinadaAPI.getPlaylists();
        if (res && res.success && Array.isArray(res.data)) {
            userPlaylists = res.data;
            if (!activePlaylistId && userPlaylists.length > 0) {
                activePlaylistId = userPlaylists[0].id;
            }
            renderPlaylistUI();
        }
    } catch (err) {
        console.warn('[Playlists] Error loading:', err);
    }
}

function openPlaylistModal() {
    const modal = document.getElementById('playlist-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        fetchAndRenderPlaylists();
    }
}

function closePlaylistModal() {
    const modal = document.getElementById('playlist-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function renderPlaylistUI() {
    const selectorContainer = document.getElementById('playlist-selector-container');
    const itemsContainer = document.getElementById('playlist-items-container');
    const nameEl = document.getElementById('active-playlist-name');
    const descEl = document.getElementById('active-playlist-desc');

    if (!selectorContainer || !itemsContainer) return;

    if (userPlaylists.length === 0) {
        selectorContainer.innerHTML = `<p class="text-xs text-gray-400">No playlists found.</p>`;
        itemsContainer.innerHTML = `
            <div class="p-8 text-center text-gray-400 text-xs space-y-2">
                <span class="material-symbols-outlined text-3xl text-gray-300">queue_music</span>
                <p class="font-semibold text-gray-600 dark:text-gray-300">Your playlist library is empty</p>
                <p class="text-[11px]">Click "+ New Playlist" above to create your first radio collection!</p>
            </div>
        `;
        if (nameEl) nameEl.innerText = "No Playlist Selected";
        if (descEl) descEl.innerText = "";
        return;
    }

    // Render selector pills
    selectorContainer.innerHTML = userPlaylists.map(pl => {
        const isActive = pl.id === activePlaylistId;
        return `
            <button onclick="selectPlaylist('${pl.id}')"
                class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${isActive ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}">
                ${pl.name} (${(pl.items || []).length})
            </button>
        `;
    }).join('');

    const activePlaylist = userPlaylists.find(p => p.id === activePlaylistId) || userPlaylists[0];
    activePlaylistId = activePlaylist.id;

    if (nameEl) nameEl.innerText = activePlaylist.name;
    if (descEl) descEl.innerText = activePlaylist.description || `${(activePlaylist.items || []).length} items in playlist`;

    const items = activePlaylist.items || [];
    if (items.length === 0) {
        itemsContainer.innerHTML = `
            <div class="p-8 text-center text-gray-400 text-xs space-y-2 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                <span class="material-symbols-outlined text-3xl text-gray-300">music_off</span>
                <p class="font-semibold text-gray-600 dark:text-gray-300">This playlist is empty</p>
                <p class="text-[11px]">Browse podcasts or programs on the station homepage and click "Add to Playlist".</p>
            </div>
        `;
        return;
    }

    itemsContainer.innerHTML = items.map((item, idx) => {
        const cover = item.coverUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=120&q=80';
        return `
            <div class="p-3 bg-gray-50 dark:bg-gray-800/40 hover:bg-primary/5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 group transition-all">
                <div class="flex items-center gap-3 overflow-hidden">
                    <span class="text-xs font-bold text-gray-400 w-4 text-center shrink-0">${idx + 1}</span>
                    <img src="${cover}" class="w-10 h-10 rounded-xl object-cover shrink-0 shadow-xs" alt="${item.title}" />
                    <div class="truncate">
                        <h5 class="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">${item.title}</h5>
                        <p class="text-xs text-gray-500 truncate">${item.artist || 'Radio Ninada Show'} • ${item.duration || '3:30'}</p>
                    </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button onclick="playPlaylistItem('${item.audioUrl.replace(/'/g, "\\'")}', '${item.title.replace(/'/g, "\\'")}', '${(item.artist || 'Radio Ninada').replace(/'/g, "\\'")}', '${cover.replace(/'/g, "\\'")}')"
                        class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer" title="Play">
                        <span class="material-symbols-outlined text-lg">play_arrow</span>
                    </button>
                    <button onclick="removePlaylistItem('${activePlaylist.id}', '${item.id}')"
                        class="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" title="Remove track">
                        <span class="material-symbols-outlined text-base">close</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function selectPlaylist(id) {
    activePlaylistId = id;
    renderPlaylistUI();
}

async function openCreatePlaylistPrompt() {
    const name = prompt("Enter new playlist name:");
    if (!name || !name.trim()) return;
    const description = prompt("Enter optional description:") || "";

    if (window.RadioNinadaAPI && typeof window.RadioNinadaAPI.createPlaylist === 'function') {
        const res = await window.RadioNinadaAPI.createPlaylist(name.trim(), description.trim());
        if (res && res.success) {
            showToast(`Playlist "${name}" created!`);
            await fetchAndRenderPlaylists();
            activePlaylistId = res.data.id;
            renderPlaylistUI();
        }
    }
}

async function openRenamePlaylistPrompt() {
    const active = userPlaylists.find(p => p.id === activePlaylistId);
    if (!active) return;
    const newName = prompt("Rename playlist:", active.name);
    if (!newName || !newName.trim()) return;

    if (window.RadioNinadaAPI && typeof window.RadioNinadaAPI.updatePlaylist === 'function') {
        const res = await window.RadioNinadaAPI.updatePlaylist(active.id, newName.trim(), active.description || "");
        if (res && res.success) {
            showToast('Playlist renamed!');
            await fetchAndRenderPlaylists();
        }
    }
}

async function deleteActivePlaylist() {
    const active = userPlaylists.find(p => p.id === activePlaylistId);
    if (!active) return;
    if (!confirm(`Are you sure you want to delete playlist "${active.name}"?`)) return;

    if (window.RadioNinadaAPI && typeof window.RadioNinadaAPI.deletePlaylist === 'function') {
        const res = await window.RadioNinadaAPI.deletePlaylist(active.id);
        if (res && res.success) {
            showToast('Playlist deleted.');
            activePlaylistId = null;
            await fetchAndRenderPlaylists();
        }
    }
}

async function addTrackToPlaylistPrompt(title, artist, audioUrl, coverUrl, duration) {
    await fetchAndRenderPlaylists();
    if (userPlaylists.length === 0) {
        showToast('Please create a playlist first!');
        openPlaylistModal();
        return;
    }

    const playlistOptions = userPlaylists.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    const choice = prompt(`Choose playlist to add "${title}":\n\n${playlistOptions}\n\nEnter number (1-${userPlaylists.length}):`);
    const index = parseInt(choice, 10) - 1;

    if (isNaN(index) || index < 0 || index >= userPlaylists.length) return;

    const targetPlaylist = userPlaylists[index];
    if (window.RadioNinadaAPI && typeof window.RadioNinadaAPI.addPlaylistItem === 'function') {
        const res = await window.RadioNinadaAPI.addPlaylistItem(targetPlaylist.id, {
            title,
            artist,
            audioUrl,
            coverUrl,
            duration,
        });

        if (res && res.success) {
            showToast(`Added to playlist "${targetPlaylist.name}"!`);
            activePlaylistId = targetPlaylist.id;
            await fetchAndRenderPlaylists();
        }
    }
}

async function removePlaylistItem(playlistId, itemId) {
    if (window.RadioNinadaAPI && typeof window.RadioNinadaAPI.removePlaylistItem === 'function') {
        const res = await window.RadioNinadaAPI.removePlaylistItem(playlistId, itemId);
        if (res && res.success) {
            showToast('Track removed from playlist.');
            await fetchAndRenderPlaylists();
        }
    }
}

function playPlaylistItem(audioUrl, title, artist, coverUrl) {
    if (window.RadioPlayer && typeof window.RadioPlayer.playTrack === 'function') {
        window.RadioPlayer.playTrack(audioUrl, title, artist, coverUrl);
        closePlaylistModal();
    }
}

function playActivePlaylist() {
    const active = userPlaylists.find(p => p.id === activePlaylistId);
    if (!active || !active.items || active.items.length === 0) {
        showToast('Playlist is empty!');
        return;
    }
    const first = active.items[0];
    playPlaylistItem(first.audioUrl, first.title, first.artist || active.name, first.coverUrl);
    showToast(`▶ Playing playlist: ${active.name}`);
}

