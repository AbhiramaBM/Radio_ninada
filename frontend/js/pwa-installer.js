/**
 * Radio Ninada 90.4 FM - PWA Installation Controller
 * Manages native beforeinstallprompt, standalone detection, and UI triggers.
 */

(function () {
  'use strict';

  let deferredPrompt = null;
  const DISMISSED_SESSION_KEY = 'radio_ninada_pwa_dismissed';

  // 1. Detect if running as standalone installed PWA
  function isRunningStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  // 2. Service Worker Registration
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Register sw.js at root scope
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered successfully, scope:', registration.scope);
            // Handle updates if needed
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New content is available; please refresh.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }
  }

  // 3. UI Helpers
  function showInstallUI() {
    if (isRunningStandalone()) {
      hideInstallUI();
      return;
    }

    // Header Button
    const headerBtn = document.getElementById('pwa-install-header-btn');
    if (headerBtn) {
      headerBtn.classList.remove('hidden');
      headerBtn.classList.add('flex');
    }

    // Drawer Card
    const drawerCard = document.getElementById('pwa-install-drawer-card');
    if (drawerCard) {
      drawerCard.classList.remove('hidden');
      drawerCard.classList.add('flex');
    }

    // Floating Banner (only if user hasn't dismissed it in current session)
    const isDismissed = sessionStorage.getItem(DISMISSED_SESSION_KEY) === 'true';
    const banner = document.getElementById('pwa-install-banner');
    if (banner && !isDismissed) {
      banner.classList.remove('hidden');
      banner.classList.add('flex');
    }
  }

  function hideInstallUI() {
    const headerBtn = document.getElementById('pwa-install-header-btn');
    if (headerBtn) {
      headerBtn.classList.add('hidden');
      headerBtn.classList.remove('flex');
    }

    const drawerCard = document.getElementById('pwa-install-drawer-card');
    if (drawerCard) {
      drawerCard.classList.add('hidden');
      drawerCard.classList.remove('flex');
    }

    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.add('hidden');
      banner.classList.remove('flex');
    }
  }

  // 4. Trigger Native Browser Installation Prompt
  async function triggerPWAInstall() {
    if (!deferredPrompt) {
      // If prompt is not available, inform user
      if (isRunningStandalone()) {
        if (typeof window.showToast === 'function') {
          window.showToast('Radio Ninada is already installed!');
        }
      } else {
        if (typeof window.showToast === 'function') {
          window.showToast('To install, tap ⋮ in your browser and choose "Install App" or "Add to Home Screen"');
        }
      }
      return;
    }

    try {
      // Show browser's native installation prompt
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log('[PWA] User choice outcome:', choiceResult.outcome);

      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the installation');
        hideInstallUI();
      } else {
        console.log('[PWA] User dismissed the installation');
      }
    } catch (err) {
      console.warn('[PWA] Installation prompt error:', err);
    } finally {
      // Prompt can only be used once
      deferredPrompt = null;
    }
  }

  function dismissInstallBanner() {
    sessionStorage.setItem(DISMISSED_SESSION_KEY, 'true');
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.add('hidden');
      banner.classList.remove('flex');
    }
  }

  // 5. Setup Event Listeners
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent automated browser prompt so we can coordinate with user's action
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] beforeinstallprompt event captured');
    showInstallUI();
  });

  window.addEventListener('appinstalled', (e) => {
    console.log('[PWA] Radio Ninada was successfully installed!');
    deferredPrompt = null;
    hideInstallUI();
    if (typeof window.showToast === 'function') {
      window.showToast('🎉 Radio Ninada installed successfully!');
    }
  });

  // Listen for standalone display-mode changes
  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    if (e.matches) {
      hideInstallUI();
    }
  });

  // Initialize
  registerServiceWorker();

  // Expose globally
  window.triggerPWAInstall = triggerPWAInstall;
  window.dismissInstallBanner = dismissInstallBanner;
  window.isRadioNinadaInstalled = isRunningStandalone;
})();
