// Real HTML5 Audio Engine & Global Media Controller
window.RadioPlayer = {
    audio: null,
    isPlaying: false,
    currentTrack: {
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        title: 'Modern FM 98.4 Live HD',
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
                if (this.currentTrack.url !== 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3') {
                    this.audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
                    if (this.isPlaying) this.audio.play().catch(() => {});
                }
            });
        }
        this.injectStickyPlayerBar();
        this.loadLiveConfig();
    },

    loadLiveConfig: async function () {
        if (window.RadioNinadaAPI && typeof window.RadioNinadaAPI.getLiveState === 'function') {
            try {
                const liveRes = await window.RadioNinadaAPI.getLiveState();
                if (liveRes && liveRes.success && liveRes.data) {
                    const data = liveRes.data;
                    if (data.streamUrl) {
                        this.currentTrack.url = data.streamUrl;
                    }
                    if (data.title) {
                        this.currentTrack.title = data.title;
                    }
                    if (data.currentRJ || data.currentProgram) {
                        this.currentTrack.artist = `${data.currentRJ || 'RJ Host'} • ${data.currentProgram || 'Live Show'}`;
                    }
                    this.updateUI();
                }
            } catch (err) {}
        }
    },

    togglePlay: function (url, title, artist, cover, isLive = true) {
        this.init();

        if (url && url !== this.currentTrack.url) {
            this.currentTrack = {
                url: url,
                title: title || 'Modern FM Broadcast',
                artist: artist || 'Radio Ninada RJ',
                cover: cover || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
                isLive: isLive
            };
            this.audio.src = url;
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.updateUI();
                showToast(`▶ Now Playing: ${this.currentTrack.title}`);
            }).catch(() => {
                this.audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
                this.audio.play().catch(() => {});
            });
            return;
        }

        if (!this.audio.src) {
            this.audio.src = this.currentTrack.url;
        }

        if (this.audio.paused) {
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.updateUI();
                showToast(`▶ Streaming ${this.currentTrack.title}`);
            }).catch(() => {
                this.audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
                this.audio.play().then(() => {
                    this.isPlaying = true;
                    this.updateUI();
                    showToast(`▶ Streaming Modern FM Live HD`);
                }).catch(() => {});
            });
        } else {
            this.audio.pause();
            this.isPlaying = false;
            this.updateUI();
            showToast(`⏸ Stream Paused`);
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
                        <h4 id="sticky-track-title" class="font-bold text-sm text-on-background truncate">Modern FM 98.4 Live HD</h4>
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
        name: "RJ Sarah Jenkins",
        show: "Echoes of the City",
        timing: "Mon - Fri • 09:00 AM - 12:00 PM",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBb2VF3wCoDGHfh6TGp5p6b_jhGFpVZxO5FKyBripLrowZivmbbJRz3IeG6fIejBg2mNnh4epO43EfzM1D8qxhOfizGttDfLj8dWwMW42oLDhTf_JBug_ZeyDmYWEHegLVut6m8P3qT2zBg7_ITbLj7qGJujTd9zeeBFEMv3Gs9o9PZVp93qDphfV-7bZJccHM1mCuQNBVhbeLKsvTEBJRSVlIOnZcqDoAkbvxp5IDlkCREyBkbNqyo",
        bio: "Sarah brings 6+ years of radio hosting experience, specializing in electronic beats, city stories, and student life banter.",
        genre: "Electronic, Synthwave, Indie Pop"
    },
    rj2: {
        name: "RJ Marcus T",
        show: "Sunrise Melodies",
        timing: "Mon - Sat • 06:00 AM - 09:00 AM",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuACFpvBKgMslehjn0gsX5RgpP_3oKPXVAO6JweoPkIxEpwvwCvWiLz4SCBvtUuFe4g9MhjeMg8YqK0CWBVRx-d4EcMhR1af8iILh8Kyl3RF5V6mB5B9J4GmWDLW_Th9A-491XOt5T_m3L84oJi7v89i3EAarGWZP9caN-AmCpq500JBrIiqiGkpx4ugq8MJgbQx07aWP2PuvSEyjq5l28kb_sslCeLamjlh_DVrP_Qo9F6raz9IleTB",
        bio: "Marcus wakes up the city with acoustic classics, morning news bulletins, and motivational coffee banter.",
        genre: "Acoustic, Classic Rock, Folk"
    },
    rj3: {
        name: "RJ Felix Blaze",
        show: "The Midday Mix",
        timing: "Mon - Fri • 12:00 PM - 03:00 PM",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwvjeP5BqUWif1pkeErOMskk58NPsXhlBo9h5cslP0f5JY39SKecU9fwA3KIPUlhjmkAuogZU6smGBWYGUX8d7bjgOYQ-pCJxUh-I28DNV6Z8T6TDi74D-WoQso8tM7oEhBfvrA90KfDhLHmHjEZcLLO7ZtHZwgamksEdxRACIz6912xYZlcMEsrXmuJQaJydZmNU6sPyS7h1xjU8zAlulAu_TvX1Ovl-ZZnRc2q6AMCO7-8bU6juo",
        bio: "Felix delivers high-energy pop hits, listener call-in requests, and campus celebrity trivia.",
        genre: "Pop Hits, Dancehall, Top 40"
    },
    rj4: {
        name: "RJ Elena Rose",
        show: "Drive Time Groove",
        timing: "Mon - Fri • 03:00 PM - 06:00 PM",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRHlQb6PO9AAvyktSCxBOv5d7hjTQXwJ3XR8CWrOkzMOpSDyJN-kUx7R8vRELYpO9coD3_j-yQZinDu98lyvZLWt1cdKp8wq7xYM9V7V654n1AdMZPumUoNxI_mn1Luue6hsGPTR5h8REDWGntxhjexXyNgPcHZgOMbyrtIhfjZedo0wnlo3Uvco7TF8XXnMdjFABPGWfyPBVgvC3c8ZZOMFHZt6wZk-S1f1bcp9HtjiQ6aaiVqzuw",
        bio: "Elena accompanies evening commuters with smooth jazz, lo-fi beats, and relaxing traffic updates.",
        genre: "Nu-Jazz, Soul, Lo-Fi Chill"
    },
    rj5: {
        name: "RJ David Vibe",
        show: "Midnight Sessions",
        timing: "Mon - Fri • 06:00 PM - 09:00 PM",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdGetlHqpowTFO1qeKIFG-BfNxIecYMIGRDLqXTfF77IlDhnGzm4orKb-KgI7RszhIkT6OlgWAIxtn-tvk95Ms2nr9UYeVZ2f2jTRT6nH8L52Ct92U6ybti6vIn4hZ8owrnZlwMfJg9eiNytus7zlAaLQQjKrYkb5X1JLPu_aQTTdHB0QqZLkVdT14BhQMNfLahnWJHiayriAc0i-oXELUxIlCQDn3rWcbQE0F_ciRnZWfPVp3170i",
        bio: "David curates deep house tracks and tech trends for evening music enthusiasts.",
        genre: "Deep House, Progressive, Techno"
    },
    rj6: {
        name: "RJ Clara Skye",
        show: "The Indie Hour",
        timing: "Mon - Sun • 09:00 PM - 12:00 AM",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgxIorA-i-iRBlAcw6h70sZWduzBiwUUS27iT8i5g_p_iLhCaJ1biQWR7Cynw_HDlrHwFzzqG76Z3SxUNGC5x47W9EmYGICmfSvpltQiG9TMxFLvsqYfgYldtaEZs6PqYj12TeijHNZylk0UftTK7DBxrZ5xcnrLKTqjAz0GXcD-kdu2S9TcmITrwIdKeUU80S8v16lDMubA-I7g57zxyumgmxTUwjo5dN-jqpANEofak7wJyG1AYh",
        bio: "Clara champions underground independent artists, live acoustic jams, and poetry readings.",
        genre: "Alternative, Indie Rock, Ambient"
    },
    rj7: {
        name: "RJ Ananya Rao",
        show: "Kannada Express & Regional Beats",
        timing: "Sat - Sun • 04:00 PM - 07:00 PM",
        img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        bio: "Ananya hosts regional music specials, Kannada chartbusters, and campus talent interviews.",
        genre: "Kannada Melodies, Folk, Fusion"
    },
    rj8: {
        name: "RJ Vikram Roy",
        show: "Late Night Chill & Confessions",
        timing: "Daily • 12:00 AM - 03:00 AM",
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
        bio: "Vikram keeps late night owls company with smooth voice dialogues, acoustic ballads, and night stories.",
        genre: "Ambient, Soft Rock, Classical Fusion"
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

// Global Event Listeners & Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initial render of college news
    renderNews('college');

    // Close modal when clicking backdrop
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('rj-modal');
        if (e.target === modal) {
            closeRjModal();
        }
    });
});
