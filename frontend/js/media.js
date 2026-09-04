/**
 * Radio Ninada - Media Library System (Admin / Staff)
 * Allows authenticated administrators and editors to upload, preview, copy URLs,
 * and delete media items directly connected to Cloudinary and PostgreSQL.
 */
(function () {
  'use strict';

  window.RadioMediaLibrary = {
    mediaItems: [],
    currentPage: 1,
    activeFolder: 'ALL',
    searchQuery: '',

    init() {
      this.injectMediaModal();
      this.bindEvents();
    },

    openModal() {
      const modal = document.getElementById('radio-media-modal');
      if (modal) {
        modal.classList.remove('hidden');
        if (window.RadioAPI.isStaffLoggedIn()) {
          this.loadMedia();
        } else {
          this.renderLoginForm();
        }
      }
    },

    closeModal() {
      const modal = document.getElementById('radio-media-modal');
      if (modal) modal.classList.add('hidden');
    },

    renderLoginForm() {
      const body = document.getElementById('media-modal-body');
      if (!body) return;

      body.innerHTML = `
        <div class="max-w-md mx-auto py-8 text-center">
          <div class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>
          <h3 class="text-xl font-bold text-on-surface mb-2">Staff &amp; Admin Sign In</h3>
          <p class="text-sm text-on-surface-variant mb-6">Enter your administrator or editor credentials to access the Media Library.</p>
          <form id="staff-login-form" class="space-y-4 text-left">
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Email Address</label>
              <input type="email" id="staff-email" required placeholder="admin@radioninada.com"
                class="w-full px-4 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:border-primary text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Password</label>
              <input type="password" id="staff-password" required placeholder="••••••••"
                class="w-full px-4 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:border-primary text-sm" />
            </div>
            <button type="submit"
              class="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all text-sm cursor-pointer shadow-md">
              Sign In to Media Library
            </button>
          </form>
        </div>`;

      const form = document.getElementById('staff-login-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('staff-email').value;
          const password = document.getElementById('staff-password').value;
          const res = await window.RadioAPI.staffLogin(email, password);
          if (res.success) {
            if (window.showToast) window.showToast('Signed in successfully.');
            this.loadMedia();
          } else {
            if (window.showToast) window.showToast(res.message || 'Login failed.');
          }
        });
      }
    },

    async loadMedia() {
      const body = document.getElementById('media-modal-body');
      if (!body) return;

      body.innerHTML = `
        <div class="py-16 text-center text-on-surface-variant">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3"></div>
          <p class="text-sm">Connecting to Cloudinary Media Library...</p>
        </div>`;

      const params = {};
      if (this.activeFolder !== 'ALL') params.folder = this.activeFolder;
      if (this.searchQuery) params.search = this.searchQuery;

      const res = await window.RadioAPI.listMedia(params);
      if (res && res.success && Array.isArray(res.data)) {
        this.mediaItems = res.data;
        this.renderMediaView();
      } else {
        body.innerHTML = `
          <div class="py-12 text-center text-on-surface-variant">
            <span class="material-symbols-outlined text-4xl text-primary/60 mb-2">cloud_off</span>
            <p class="text-sm">Unable to load media items: ${res?.message || 'Check database connection'}</p>
          </div>`;
      }
    },

    renderMediaView() {
      const body = document.getElementById('media-modal-body');
      if (!body) return;

      const user = window.RadioAPI.getStaffUser();

      body.innerHTML = `
        <!-- Top Toolbar -->
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-outline/20">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              Logged in as: ${user?.name || 'Staff'} (${user?.role || 'ADMIN'})
            </span>
            <button onclick="window.RadioAPI.staffLogout()" class="text-xs text-error hover:underline ml-2 cursor-pointer">Sign Out</button>
          </div>
          <div class="flex items-center gap-3 w-full md:w-auto">
            <input type="text" id="media-search-input" value="${this.searchQuery}" placeholder="Search files..."
              class="px-3 py-1.5 rounded-lg border border-outline bg-surface text-xs focus:outline-none focus:border-primary flex-1 md:w-48" />
            <label class="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
              <span class="material-symbols-outlined text-base">cloud_upload</span>
              Upload to Cloudinary
              <input type="file" id="media-file-input" class="hidden" accept="image/*,audio/*,video/*,.pdf" />
            </label>
          </div>
        </div>

        <!-- Media Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2">
          ${this.mediaItems.length === 0 ? `
            <div class="col-span-full py-12 text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-4xl text-primary/40 mb-2">perm_media</span>
              <p class="text-sm font-medium">No media uploaded yet. Use the upload button above.</p>
            </div>
          ` : this.mediaItems.map((item) => {
            const isAudio = item.resourceType === 'video' || item.mimeType?.startsWith('audio/');
            const sizeStr = window.RadioUtils ? window.RadioUtils.formatBytes(item.fileSize) : `${item.fileSize || 0} B`;
            const dateStr = window.RadioUtils ? window.RadioUtils.formatDate(item.createdAt) : '';

            return `
              <div class="border border-outline/20 rounded-xl overflow-hidden bg-surface-container/30 hover:shadow-md transition-all flex flex-col group">
                <div class="aspect-video bg-black/5 relative flex items-center justify-center overflow-hidden">
                  ${isAudio ? `
                    <div class="text-center p-3">
                      <span class="material-symbols-outlined text-4xl text-primary">audiotrack</span>
                      <p class="text-[10px] text-on-surface-variant line-clamp-1 mt-1">${item.originalName}</p>
                    </div>
                  ` : `
                    <img src="${item.cloudinaryUrl}" alt="${item.originalName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  `}
                  <div class="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] text-white font-mono uppercase">
                    ${item.format || item.resourceType}
                  </div>
                </div>
                <div class="p-3 flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <p class="font-semibold text-on-surface truncate" title="${item.originalName}">${item.originalName}</p>
                    <p class="text-[10px] text-on-surface-variant mt-0.5">${sizeStr} • ${dateStr}</p>
                    <p class="text-[9px] text-primary/80 font-mono truncate mt-1">${item.cloudinaryPublicId}</p>
                  </div>
                  <div class="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-outline/10">
                    <button onclick="navigator.clipboard.writeText('${item.cloudinaryUrl}'); if(window.showToast) window.showToast('Copied Cloudinary URL!');"
                      class="text-primary hover:underline text-[11px] font-medium flex items-center gap-0.5 cursor-pointer">
                      <span class="material-symbols-outlined text-xs">content_copy</span> Copy URL
                    </button>
                    <button onclick="window.RadioMediaLibrary.deleteItem('${item.id}')"
                      class="text-error hover:text-error/80 text-[11px] cursor-pointer" title="Delete from Cloudinary & DB">
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>`;

      // Bind search input
      const searchInput = document.getElementById('media-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.trim();
          if (this._searchTimer) clearTimeout(this._searchTimer);
          this._searchTimer = setTimeout(() => this.loadMedia(), 400);
        });
      }

      // Bind upload file input
      const fileInput = document.getElementById('media-file-input');
      if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('file', file);

          if (window.showToast) window.showToast('Uploading to Cloudinary...');
          const res = await window.RadioAPI.uploadMedia(formData);
          if (res && res.success) {
            if (window.showToast) window.showToast('Uploaded successfully to Cloudinary!');
            this.loadMedia();
          } else {
            if (window.showToast) window.showToast(res.message || 'Upload failed.');
          }
        });
      }
    },

    async deleteItem(id) {
      if (!confirm('Are you sure you want to permanently delete this media asset from Cloudinary and the database?')) {
        return;
      }
      const res = await window.RadioAPI.deleteMedia(id);
      if (res && res.success) {
        if (window.showToast) window.showToast('Deleted media asset successfully.');
        this.loadMedia();
      } else {
        if (window.showToast) window.showToast(res.message || 'Delete failed.');
      }
    },

    injectMediaModal() {
      if (document.getElementById('radio-media-modal')) return;

      const modalHtml = `
        <div id="radio-media-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm hidden" role="dialog">
          <div class="bg-surface text-on-surface rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-white/20 relative animate-scale-in">
            <div class="flex items-center justify-between pb-4 border-b border-outline/20">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-primary text-2xl">perm_media</span>
                <h2 class="text-xl font-bold font-headline-md">Cloudinary Media Library</h2>
              </div>
              <button onclick="window.RadioMediaLibrary.closeModal()" class="material-symbols-outlined text-on-surface-variant hover:text-on-surface cursor-pointer">close</button>
            </div>
            <div id="media-modal-body" class="mt-4"></div>
          </div>
        </div>`;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    bindEvents() {
      // Allow opening media library from footer or keyboard shortcut Alt+M
      window.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'm') {
          this.openModal();
        }
      });
    },
  };
})();
