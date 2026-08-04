// Real HTML5 Audio Engine & Global Media Controller
window.RadioPlayer = {
    audio: null,
    isPlaying: false,
    liveConfigPromise: null,
    liveStreamReady: false,
    currentTrack: {
        url: '',
        title: 'Radio Ninada Live',
        artist: 'RJ Sarah Jenkins • Morning Vibe',
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
                showToast('The live stream could not be played. Please try again shortly.');
            });
        }
        this.injectStickyPlayerBar();
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
            } catch (err) {}
        }
        this.liveStreamReady = true;
        this.currentTrack.url = defaultStream;
        this.updateUI();
    },

    isValidLiveStreamUrl: function (url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const parsed = new URL(url);
            return /^https?:$/.test(parsed.protocol) && !url.includes('stream.radioninada.com');
        } catch (_) {
            return false;
        }
    },

    togglePlay: async function (url, title, artist, cover, isLive = true) {
        await this.init();

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
                showToast(`▶ Streaming ${this.currentTrack.title}`);
            } catch (err) {
                console.warn('[RadioPlayer] Primary stream unreachable, attempting fallback stream...', err);
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
                    showToast('Unable to start live stream playback.');
                }
            }
        } else {
            this.audio.pause();
            this.isPlaying = false;
            this.updateUI();
            showToast('⏸ Stream Paused');
        }
    },

    playTrack: function(url, title, artist, cover) {
        this.togglePlay(url, title, artist, cover, false);
    },

    setVolume: function (val) {
        this.volume = parseFloat(val);
        if (this.audio) this.audio.volume = this.volume;
        const volSlider = document.getElementById('sticky-vol-slider');
        if (volSlider) volSlider.value = this.volume;
    },

    seek: function (percent) {
        if (this.audio && this.audio.duration && !isNaN(this.audio.duration)) {
            this.audio.currentTime = (percent / 100) * this.audio.duration;
        }
    },

    onPlayStateChange: function (playing) {
        this.isPlaying = playing;
        this.updateUI();
        if (playing && window.RadioAuth && typeof window.RadioAuth.recordListeningHistory === 'function') {
            window.RadioAuth.recordListeningHistory(this.currentTrack);
        }
    },

    playTrack: function (url, title, artist, cover) {
        this.togglePlay(url, title, artist, cover, false);
        if (window.RadioAuth && typeof window.RadioAuth.recordListeningHistory === 'function') {
            window.RadioAuth.recordListeningHistory({ title, artist, cover, url });
        }
    },

    updateUI: function () {
        const iconName = this.isPlaying ? 'pause' : 'play_arrow';

        const heroIcon = document.getElementById('hero-play-icon');
        if (heroIcon) heroIcon.innerText = iconName;

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

        const stickyBar = document.getElementById('sticky-player-bar');
        if (stickyBar) {
            if (this.currentTrack.title) {
                stickyBar.classList.remove('translate-y-full', 'opacity-0');
            }
            const stickyPlayIcon = document.getElementById('sticky-play-icon');
            if (stickyPlayIcon) stickyPlayIcon.innerText = iconName;

            const stickyTitle = document.getElementById('sticky-track-title');
            if (stickyTitle) stickyTitle.innerText = this.currentTrack.title;

            const stickyArtist = document.getElementById('sticky-track-artist');
            if (stickyArtist) stickyArtist.innerText = this.currentTrack.artist;

            document.querySelectorAll('[data-live-title]').forEach((element) => {
                element.textContent = this.currentTrack.title;
            });
            document.querySelectorAll('[data-live-description]').forEach((element) => {
                element.textContent = this.currentTrack.artist;
            });

            const stickyCover = document.getElementById('sticky-track-cover');
            if (stickyCover && this.currentTrack.cover) stickyCover.src = this.currentTrack.cover;
        }
    },

    updateTimeProgress: function () {
        if (!this.audio) return;
        const curTime = this.audio.currentTime || 0;
        const dur = this.audio.duration || 0;

        const curTimeStr = this.formatTime(curTime);
        const durStr = (!isNaN(dur) && dur > 0) ? this.formatTime(dur) : 'LIVE';

        const timeCurEl = document.getElementById('sticky-time-current');
        const timeDurEl = document.getElementById('sticky-time-duration');
        const sliderEl = document.getElementById('sticky-progress-slider');

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
    },

    injectStickyPlayerBar: function () {
        if (document.getElementById('sticky-player-bar')) return;

        const barHTML = `
        <div id="sticky-player-bar" class="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/30 shadow-2xl px-4 py-3 transition-all duration-300 transform translate-y-full opacity-0">
            <div class="max-w-container-max mx-auto flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 w-1/4 min-w-[200px]">
                    <img id="sticky-track-cover" class="w-12 h-12 rounded-xl object-cover shadow-md border border-white/20 shrink-0" src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=150&q=80" alt="Cover" />
                    <div class="truncate">
                        <h4 id="sticky-track-title" class="font-bold text-sm text-on-background truncate">Radio Ninada 90.4 FM Live</h4>
                        <p id="sticky-track-artist" class="text-xs text-on-surface-variant truncate">RJ Sarah Jenkins • Morning Vibe</p>
                    </div>
                </div>

                <div class="flex flex-col items-center gap-1 w-2/4 max-w-md">
                    <div class="flex items-center gap-4">
                        <button onclick="RadioPlayer.seek(0)" class="text-on-surface-variant hover:text-primary transition-colors" title="Restart">
                            <span class="material-symbols-outlined text-xl">replay_10</span>
                        </button>
                        <button onclick="RadioPlayer.togglePlay()" class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                            <span id="sticky-play-icon" class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                        </button>
                        <button onclick="RadioPlayer.seek(100)" class="text-on-surface-variant hover:text-primary transition-colors" title="Forward">
                            <span class="material-symbols-outlined text-xl">forward_10</span>
                        </button>
                    </div>
                    <div class="flex items-center gap-2 w-full text-[10px] text-on-surface-variant font-mono">
                        <span id="sticky-time-current">00:00</span>
                        <input id="sticky-progress-slider" type="range" min="0" max="100" value="0" oninput="RadioPlayer.seek(this.value)" class="w-full h-1 bg-outline-variant/40 rounded-lg appearance-none cursor-pointer accent-primary" />
                        <span id="sticky-time-duration">LIVE</span>
                    </div>
                </div>

                <div class="flex items-center justify-end gap-3 w-1/4 min-w-[140px]">
                    <span class="material-symbols-outlined text-sm text-on-surface-variant">volume_up</span>
                    <input id="sticky-vol-slider" type="range" min="0" max="1" step="0.05" value="0.8" oninput="RadioPlayer.setVolume(this.value)" class="w-20 h-1 bg-outline-variant/40 rounded-lg appearance-none cursor-pointer accent-primary" />
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', barHTML);
    }
};

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

function openMediaPreview(title, kind) {
    showToast(kind === 'video' ? `🎬 Opening Video Short: "${title}"` : `📷 Viewing High-Res Photo: "${title}"`);
}

// Helper to resolve server upload URLs to absolute backend URLs
function resolveServerUrl(url) {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
        return 'http://localhost:5000' + url;
    }
    return url;
}

// Global Dynamic Data Synchronizer
async function loadDynamicData() {
    if (!window.RadioNinadaAPI) return;

    // 1. Synchronize RJs
    try {
        const rjRes = await window.RadioNinadaAPI.getRJs();
        if (rjRes && rjRes.success && Array.isArray(rjRes.data)) {
            const container = document.getElementById('rj-list-container');
            if (container) {
                for (const k in rjData) {
                    if (k.startsWith('dyn_')) delete rjData[k];
                }
                if (rjRes.data.length === 0) {
                    container.innerHTML = `<div class="text-xs text-on-surface-variant italic py-4 col-span-full">No RJ hosts listed at this moment.</div>`;
                } else {
                    container.innerHTML = rjRes.data.map(rj => {
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
            }
        }
    } catch (e) {
        console.warn('Error loading RJs from API:', e);
    }

    // 2. Synchronize Podcasts
    try {
        const podRes = await window.RadioNinadaAPI.getPodcasts();
        if (podRes && podRes.success && Array.isArray(podRes.data) && podRes.data.length > 0) {
            const podGrid = document.getElementById('podcast-grid');
            if (podGrid) {
                podGrid.innerHTML = podRes.data.map((pod, idx) => {
                    const coverUrl = resolveServerUrl(pod.coverUrl) || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80';
                    const audioUrl = resolveServerUrl(pod.audioUrl) || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
                    const catClass = pod.category ? pod.category.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'talk-show';

                    return `
                        <div class="podcast-card popular recently-added ${catClass} bg-white rounded-2xl p-md border border-outline-variant/30 hover:shadow-xl transition-all group flex flex-col justify-between">
                            <div>
                                <div class="relative aspect-video rounded-xl overflow-hidden mb-md">
                                    <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${coverUrl}" alt="${pod.title}" />
                                    <span class="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-bold px-sm py-0.5 rounded-full uppercase">${pod.category || 'Podcast'}</span>
                                    <button onclick="RadioPlayer.playTrack('${audioUrl}', '${pod.title.replace(/'/g, "\\'")}', 'S${pod.season || 1} E${pod.episodeNumber || 1}', '${coverUrl}')"
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
        }
    } catch (e) {
        console.warn('Error loading podcasts from API:', e);
    }

    // 3. Synchronize News
    try {
        const newsRes = await window.RadioNinadaAPI.getNews();
        if (newsRes && newsRes.success && Array.isArray(newsRes.data) && newsRes.data.length > 0) {
            // Group news by category
            newsRes.data.forEach(item => {
                const cat = (item.category || 'Local').toLowerCase();
                const targetCat = newsData[cat] ? cat : 'local';
                const formattedItem = {
                    title: item.title,
                    date: new Date(item.createdAt).toLocaleDateString(),
                    desc: item.content,
                    tag: item.category || 'News'
                };
                if (!newsData[targetCat].some(n => n.title === item.title)) {
                    newsData[targetCat].unshift(formattedItem);
                }
            });
            renderNews('college');
        }
    } catch (e) {
        console.warn('Error loading news from API:', e);
    }

    // 4. Synchronize Events
    try {
        const evtRes = await window.RadioNinadaAPI.getEvents();
        if (evtRes && evtRes.success && Array.isArray(evtRes.data) && evtRes.data.length > 0) {
            const eventsContainer = document.querySelector('#events .grid');
            if (eventsContainer) {
                eventsContainer.innerHTML = evtRes.data.map(evt => {
                    const bannerUrl = resolveServerUrl(evt.banner) || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80';
                    const dateStr = new Date(evt.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
                    
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
        }
    } catch (e) {
        console.warn('Error loading events from API:', e);
    }
}

// Global Event Listeners & Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initial render of college news
    renderNews('college');

    // Fetch dynamic backend data
    loadDynamicData();

    // Close modal when clicking backdrop
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('rj-modal');
        if (e.target === modal) {
            closeRjModal();
        }
    });
});

