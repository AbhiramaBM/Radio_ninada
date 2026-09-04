/**
 * Radio Ninada - Utilities & UI Helpers
 */
(function () {
  'use strict';

  window.RadioUtils = {
    showToast(message, type = 'success') {
      const toast = document.getElementById('toast-alert');
      const toastMsg = document.getElementById('toast-msg');
      if (!toast || !toastMsg) {
        console.log(`[Toast] ${message}`);
        return;
      }
      toastMsg.textContent = message;
      toast.classList.remove('translate-x-full', 'opacity-0');
      toast.classList.add('translate-x-0', 'opacity-100');

      if (window._toastTimeout) clearTimeout(window._toastTimeout);
      window._toastTimeout = setTimeout(() => {
        toast.classList.remove('translate-x-0', 'opacity-100');
        toast.classList.add('translate-x-full', 'opacity-0');
      }, 3500);
    },

    formatTime(seconds) {
      if (isNaN(seconds) || seconds < 0) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return dateStr;
      }
    },

    formatBytes(bytes, decimals = 2) {
      if (!bytes || bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
  };

  // Expose global showToast helper
  window.showToast = window.RadioUtils.showToast;
})();
