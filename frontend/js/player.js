/**
 * Radio Ninada - Audio Engine Bridge
 * Delegates to the unified RadioPlayer media controller defined in js/app.js.
 */
(function () {
  'use strict';

  // Ensure early callers before app.js finish loading don't error out
  if (!window.RadioPlayer) {
    window.RadioPlayer = {
      playTrack: function (...args) {
        if (typeof window.RadioPlayer.playTrack === 'function' && window.RadioPlayer._isReady) {
          return window.RadioPlayer.playTrack(...args);
        }
      },
      togglePlay: function (...args) {
        if (typeof window.RadioPlayer.togglePlay === 'function' && window.RadioPlayer._isReady) {
          return window.RadioPlayer.togglePlay(...args);
        }
      },
      toggleLiveRadio: function (...args) {
        if (typeof window.RadioPlayer.toggleLiveRadio === 'function' && window.RadioPlayer._isReady) {
          return window.RadioPlayer.toggleLiveRadio(...args);
        }
      }
    };
  }
})();
