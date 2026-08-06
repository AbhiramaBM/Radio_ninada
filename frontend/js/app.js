// Real HTML5 Audio Engine & Global Media Controller
window.RadioPlayer = {
    audio: null,
    isPlaying: false,
    isDismissed: false,
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

    hideAudioPlayer: function () {
        this.isDismissed = true;

        if (this.audio && !this.audio.paused) {
            this.audio.pause();
            this.isPlaying = false;
            this.updateUI();
        }

        const globalPlayer = document.getElementById('global-audio-player');
        if (globalPlayer) {
            globalPlayer.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
            globalPlayer.classList.remove('opacity-100', 'translate-y-0');
        }
    },

    showAudioPlayer: function () {
        this.isDismissed = false;

        const globalPlayer = document.getElementById('global-audio-player');
        if (globalPlayer) {
            globalPlayer.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
            globalPlayer.classList.add('opacity-100', 'translate-y-0');
        }
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
        if (globalPlayer && !this.isDismissed && this.currentTrack.title) {
            globalPlayer.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
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

        document.querySelectorAll('[data-live-title]').forEach((element) => {
            element.textContent = this.currentTrack.title;
        });
        document.querySelectorAll('[data-live-description]').forEach((element) => {
            element.textContent = this.currentTrack.artist;
        });
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
    RadioPlayer.hideAudioPlayer();
}

function showAudioPlayer() {
    RadioPlayer.showAudioPlayer();
}

function closePlayer() {
    RadioPlayer.hideAudioPlayer();
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

// News Data & Category Switching
const newsData = {
    college: [
        { title: "Campus Cultural Fest Registrations Open Next Week", date: "Today", desc: "Students can register for music battles, drama, and radio anchoring events starting Monday.", tag: "College" },
        { title: "Engineering Department Wins National Radio Tech Expo", date: "Yesterday", desc: "Our student engineering team secured 1st place for designing a low-power FM transmitter.", tag: "Campus Tech" },
        { title: "Student Council Announces Annual Inter-College Sports Meet", date: "2 days ago", desc: "Over 20 colleges across Karnataka will participate in football, basketball, and athletics.", tag: "Sports" }
    ],
    local: [
        { title: "City Metro Phase 3 Line Opening This Friday", date: "Today", desc: "New metro connectivity directly reaches college campus gate 2, reducing commute times.", tag: "Transit" },
        { title: "Weekend Flea Market & Live Music Festival in City Park", date: "Yesterday", desc: "Enjoy organic food stalls, local handicrafts, and live performances by acoustic artists.", tag: "City Life" },
        { title: "New Green Corridor Initiated by City Municipal Corporation", date: "3 days ago", desc: "Plantation drive along major avenues aiming to plant 50,000 saplings this monsoon.", tag: "Environment" }
    ],
    karnataka: [
        { title: "Bengaluru Tech Summit 2026 Dates Announced", date: "Today", desc: "Asia's largest technology event will showcase innovations in AI, space tech, and green energy.", tag: "Karnataka Tech" },
        { title: "Coastal Karnataka Monsoon Tourism Festival Begins", date: "Yesterday", desc: "Special monsoon trails, waterfall treks, and traditional coastal culinary events unveiled.", tag: "Tourism" },
        { title: "State Education Board Introduces Digital Audio Learning Labs", date: "2 days ago", desc: "Schools across Karnataka to adopt podcast-based audio modules for interactive science classes.", tag: "Education" }
    ],
    india: [
        { title: "ISRO Successfully Launches Student-Built Research Satellite", date: "Today", desc: "Sriharikota rocket launches satellite payload designed by university students from 5 states.", tag: "Space" },
        { title: "National Youth Music Awards 2026 Nominations Open", date: "Yesterday", desc: "Recognizing independent indie vocalists, instrumentalists, and digital audio creators.", tag: "Music Industry" },
        { title: "India Achieves New Milestone in Renewable Energy Production", date: "3 days ago", desc: "Solar and wind energy contribution crosses 45% of total grid power generation.", tag: "National" }
    ],
    international: [
        { title: "Global Podcasting & Audio Conference Held in Geneva", date: "Today", desc: "Broadcasters from 80 countries gather to discuss future trends in digital radio and AI streaming.", tag: "Global Radio" },
        { title: "International Indie Artist Summit Announces World Tour", date: "Yesterday", desc: "Featured independent musicians to tour 15 cities worldwide including New Delhi and Tokyo.", tag: "World Music" },
        { title: "UNESCO Highlights Community Radio as Key Driver for Digital Literacy", date: "2 days ago", desc: "Report praises community radio initiatives empowering youth voices in developing nations.", tag: "UNESCO" }
    ]
};

function renderNews(category) {
    const container = document.getElementById('news-container');
    if (!container) return;
    const items = newsData[category] || [];
    container.innerHTML = items.map(item => `
        <div class="bg-white rounded-2xl p-md border border-outline-variant/30 hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
                <div class="flex justify-between items-center mb-xs">
                    <span class="bg-surface-container text-primary font-bold text-[10px] px-sm py-0.5 rounded-full uppercase">${item.tag}</span>
                    <span class="text-xs text-on-surface-variant">${item.date}</span>
                </div>
                <h3 class="font-headline-md text-[18px] font-bold leading-snug mb-xs group-hover:text-primary transition-colors">${item.title}</h3>
                <p class="text-on-surface-variant text-sm line-clamp-3">${item.desc}</p>
            </div>
            <div class="mt-md pt-sm border-t border-outline-variant/20 flex justify-between items-center text-xs text-primary font-bold cursor-pointer group-hover:translate-x-1 transition-transform">
                <span>Read Full Bulletin</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
        </div>
    `).join('');
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
        return 'http://localhost:5000' + url;
    }
    return url;
}

// Realtime Firestore Sync Subscriptions
function initRealtimeListeners() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;
    try {
        const db = firebase.firestore();

        // 1. Live Radio State Sync
        db.collection('live').doc('live-config').onSnapshot(snapshot => {
            if (snapshot.exists) {
                const data = snapshot.data();
                if (data && window.RadioPlayer) {
                    if (data.streamUrl && RadioPlayer.isValidLiveStreamUrl(data.streamUrl)) {
                        RadioPlayer.currentTrack.url = data.streamUrl;
                    }
                    if (data.title) RadioPlayer.currentTrack.title = data.title;
                    if (data.currentRJ || data.currentProgram) {
                        RadioPlayer.currentTrack.artist = `${data.currentRJ || 'RJ Ananya'} • ${data.currentProgram || 'Ninada Morning Buzz'}`;
                    }
                    RadioPlayer.updateUI();

                    const titleEl = document.getElementById('live-listeners-count-display');
                    const subEl = document.getElementById('live-broadcast-status-subtitle');
                    if (titleEl) {
                        const statusLabel = data.isLive ? 'ON AIR LIVE 🔴' : 'OFF AIR ⚪';
                        titleEl.innerText = `${data.title || 'Radio Ninada 90.4 FM'} — ${statusLabel}`;
                    }
                    if (subEl && (data.currentProgram || data.currentRJ)) {
                        subEl.innerText = `${data.currentProgram || 'Live Radio Broadcast'} with ${data.currentRJ || 'Station Host'}`;
                    }
                }
            }
        }, err => console.warn('[RealtimeSync] Live state error:', err));

        // 2. RJs Realtime Sync
        db.collection('rjs').onSnapshot(snapshot => {
            const rjs = [];
            snapshot.forEach(doc => rjs.push({ id: doc.id, ...doc.data() }));
            if (rjs.length > 0) renderRJsUI(rjs);
        }, err => console.warn('[RealtimeSync] RJs error:', err));

        // 3. Podcasts Realtime Sync
        db.collection('podcasts').onSnapshot(snapshot => {
            const pods = [];
            snapshot.forEach(doc => pods.push({ id: doc.id, ...doc.data() }));
            if (pods.length > 0) renderPodcastsUI(pods);
        }, err => console.warn('[RealtimeSync] Podcasts error:', err));

        // 4. Events Realtime Sync
        db.collection('events').onSnapshot(snapshot => {
            const evts = [];
            snapshot.forEach(doc => evts.push({ id: doc.id, ...doc.data() }));
            if (evts.length > 0) renderEventsUI(evts);
        }, err => console.warn('[RealtimeSync] Events error:', err));

        // 5. Gallery Realtime Sync
        db.collection('gallery').onSnapshot(snapshot => {
            const items = [];
            snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
            if (items.length > 0) renderGalleryUI(items);
        }, err => console.warn('[RealtimeSync] Gallery error:', err));

        // 6. News Realtime Sync
        db.collection('news').onSnapshot(snapshot => {
            const newsItems = [];
            snapshot.forEach(doc => newsItems.push({ id: doc.id, ...doc.data() }));
            if (newsItems.length > 0) renderNewsUI(newsItems);
        }, err => console.warn('[RealtimeSync] News error:', err));

        console.log('⚡ Firestore Real-time Listeners Activated');
    } catch (e) {
        console.warn('[RealtimeSync] Initialization skipped:', e.message);
    }
}

function renderRJsUI(rjList) {
    const container = document.getElementById('rj-list-container');
    if (!container) return;
    for (const k in rjData) {
        if (k.startsWith('dyn_')) delete rjData[k];
    }
    if (rjList.length === 0) {
        container.innerHTML = `<div class="text-xs text-on-surface-variant italic py-4 col-span-full">No RJ hosts listed at this moment.</div>`;
        return;
    }
    container.innerHTML = rjList.map(rj => {
        const rjKey = 'dyn_' + rj.id;
        const photoUrl = resolveServerUrl(rj.photo) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80';
        rjData[rjKey] = {
            name: rj.name,
            show: rj.designation || 'On-Air Host',
            timing: rj.status === 'ACTIVE' ? 'On Air Active' : 'Station Host',
            img: photoUrl,
            bio: rj.bio || 'Station Presenter at Radio Ninada.',
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
}

function renderPodcastsUI(podList) {
    const podGrid = document.getElementById('podcast-grid');
    if (!podGrid) return;
    if (podList.length === 0) {
        podGrid.innerHTML = `<div class="col-span-full py-12 text-center text-on-surface-variant italic font-body-md">No podcast episodes published yet. Tune in soon for fresh shows!</div>`;
        return;
    }
    podGrid.innerHTML = podList.map((pod) => {
        const coverUrl = resolveServerUrl(pod.coverUrl) || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80';
        const audioUrl = resolveServerUrl(pod.audioUrl) || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        const catClass = pod.category ? pod.category.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'talk-show';

        return `
            <div class="podcast-card popular recently-added ${catClass} bg-white rounded-2xl p-md border border-outline-variant/30 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                    <div class="relative aspect-video rounded-xl overflow-hidden mb-md">
                        <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${coverUrl}" alt="${pod.title}" />
                        <span class="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-bold px-sm py-0.5 rounded-full uppercase">${pod.category || 'Podcast'}</span>
                        <button onclick="RadioPlayer.playTrack('${audioUrl.replace(/'/g, "\\'")}', '${pod.title.replace(/'/g, "\\'")}', 'S${pod.season || 1} E${pod.episodeNumber || 1}', '${coverUrl.replace(/'/g, "\\'")}')"
                            class="absolute inset-0 m-auto w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all cursor-pointer">
                            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                        </button>
                    </div>
                    <h3 class="font-headline-md text-[18px] font-bold leading-snug mb-xs group-hover:text-primary transition-colors">${pod.title}</h3>
                    <p class="text-on-surface-variant text-xs mb-sm">S${pod.season || 1} E${pod.episodeNumber || 1} • ${pod.duration || '30:00'}</p>
                    <p class="text-on-surface-variant text-sm line-clamp-2">${pod.description || ''}</p>
                </div>
                <div class="mt-md pt-sm border-t border-outline-variant/20 flex justify-between items-center text-xs text-on-surface-variant">
                    <span>${pod.downloads || 0} Downloads</span>
                    <span class="material-symbols-outlined text-sm hover:text-primary cursor-pointer" onclick="showToast('Episode bookmarked!')">bookmark</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderEventsUI(evtList) {
    const eventsContainer = document.querySelector('#events .grid');
    if (!eventsContainer) return;
    if (evtList.length === 0) {
        eventsContainer.innerHTML = `<div class="col-span-full py-12 text-center text-on-surface-variant italic font-body-md">No upcoming events scheduled.</div>`;
        return;
    }
    eventsContainer.innerHTML = evtList.map(evt => {
        const bannerUrl = resolveServerUrl(evt.banner) || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80';
        const dateStr = evt.eventDate ? new Date(evt.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : 'UPCOMING';

        return `
            <div class="bg-white rounded-2xl overflow-hidden border border-outline-variant/30 hover:shadow-2xl transition-all duration-300 group">
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
                    <button onclick="rsvpToast('${evt.title.replace(/'/g, "\\'")}')"
                        class="w-full bg-surface-container-low text-primary font-bold py-sm rounded-xl hover:bg-primary hover:text-white transition-all text-sm cursor-pointer">
                        RSVP / Get Free Pass
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderGalleryUI(galList) {
    const galGrid = document.getElementById('gallery-grid');
    if (!galGrid) return;
    if (galList.length === 0) {
        galGrid.innerHTML = `<div class="col-span-full py-12 text-center text-on-surface-variant italic font-body-md">No media items or BTS shorts uploaded yet. Admin can upload media from the dashboard.</div>`;
        return;
    }
    galGrid.innerHTML = galList.map(item => {
        const isVideo = item.type === 'VIDEO' || item.category === 'BTS Shorts' || (item.mediaUrl && item.mediaUrl.match(/\.(mp4|webm|mov|mkv)$/i));
        const itemClass = isVideo ? 'bts' : 'photos';
        const displayThumb = resolveServerUrl(item.thumbnail || item.mediaUrl);
        const durationTag = item.duration || (isVideo ? 'Shorts' : '');
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
    newsItems.forEach(item => {
        const cat = (item.category || 'Local').toLowerCase();
        const targetCat = newsData[cat] ? cat : 'local';
        const formattedItem = {
            title: item.title,
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today',
            desc: item.content || item.description || '',
            tag: item.category || 'News'
        };
        if (!newsData[targetCat].some(n => n.title === item.title)) {
            newsData[targetCat].unshift(formattedItem);
        }
    });
    renderNews('college');
}

// Global Dynamic Data Synchronizer
async function loadDynamicData() {
    if (!window.RadioNinadaAPI) return;

    try {
        const rjRes = await window.RadioNinadaAPI.getRJs();
        if (rjRes && rjRes.success && Array.isArray(rjRes.data)) {
            renderRJsUI(rjRes.data);
        }
    } catch (e) { console.warn('[loadDynamicData] RJs fetch fallback:', e); }

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
        }
    } catch (e) { console.warn('[loadDynamicData] Events fetch fallback:', e); }

    try {
        const galRes = await window.RadioNinadaAPI.getGallery();
        if (galRes && galRes.success && Array.isArray(galRes.data)) {
            renderGalleryUI(galRes.data);
        }
    } catch (e) { console.warn('[loadDynamicData] Gallery fetch fallback:', e); }
}

// Global Event Listeners & Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Radio Ninada 90.4 FM Live Stream Player & Config
    if (window.RadioPlayer && typeof window.RadioPlayer.init === 'function') {
        window.RadioPlayer.init();
    }

    // Initial render of college news
    renderNews('college');

    // Fetch dynamic backend data
    loadDynamicData();

    // Initialize real-time listeners for instant synchronization
    setTimeout(initRealtimeListeners, 1000);

    // Close modal when clicking backdrop
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


