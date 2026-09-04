/**
 * Radio Ninada - Programs & Schedule Manager
 */
(function () {
  'use strict';

  window.RadioPrograms = {
    programs: [],
    schedules: [],
    rjs: [],

    async init() {
      await Promise.allSettled([
        this.loadPrograms(),
        this.loadSchedule(),
        this.loadRJs(),
      ]);
    },

    async loadPrograms() {
      const container = document.getElementById('programs-cards-container');
      if (!container) return;

      try {
        const res = await window.RadioAPI.getPrograms();
        if (res && res.success && Array.isArray(res.data)) {
          this.programs = res.data;
          this.renderPrograms();
        }
      } catch (err) {
        console.warn('[RadioPrograms] Failed to load programs:', err);
      }
    },

    async loadSchedule() {
      try {
        const res = await window.RadioAPI.getSchedule();
        if (res && res.success && Array.isArray(res.data)) {
          this.schedules = res.data;
        }
      } catch (err) {
        console.warn('[RadioPrograms] Failed to load schedule:', err);
      }
    },

    async loadRJs() {
      const container = document.getElementById('rj-team-container');
      if (!container) return;

      try {
        const res = await window.RadioAPI.getRJs();
        if (res && res.success && Array.isArray(res.data)) {
          this.rjs = res.data;
          this.renderRJs();
        }
      } catch (err) {
        console.warn('[RadioPrograms] Failed to load RJs:', err);
      }
    },

    renderPrograms() {
      const container = document.getElementById('programs-cards-container');
      if (!container || this.programs.length === 0) return;

      container.innerHTML = this.programs.map((program) => {
        const name = window.RadioUtils?.escapeHtml(program.name) || program.name;
        const desc = window.RadioUtils?.escapeHtml(program.description) || program.description;
        const thumb = program.thumbnail || 'images/program_default.jpg';
        const hostName = program.host?.name || program.hostName || 'Radio Host';
        const schedule = program.schedule || 'Daily Broadcast';

        return `
          <div class="glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all p-5 flex flex-col md:flex-row gap-5 items-center">
            <img src="${thumb}" alt="${name}" class="w-full md:w-36 h-36 object-cover rounded-xl shadow-inner flex-shrink-0" loading="lazy" />
            <div class="flex-1 text-center md:text-left">
              <span class="inline-block bg-primary/10 text-primary px-3 py-0.5 rounded-full text-xs font-semibold mb-2">
                ${schedule}
              </span>
              <h4 class="text-xl font-bold text-on-surface mb-1">${name}</h4>
              <p class="text-xs text-primary font-medium mb-2">Hosted by ${hostName}</p>
              <p class="text-sm text-on-surface-variant line-clamp-2">${desc}</p>
            </div>
          </div>`;
      }).join('');
    },

    renderRJs() {
      const container = document.getElementById('rj-team-container');
      if (!container || this.rjs.length === 0) return;

      container.innerHTML = this.rjs.map((rj) => {
        const name = window.RadioUtils?.escapeHtml(rj.name) || rj.name;
        const desig = window.RadioUtils?.escapeHtml(rj.designation) || rj.designation || 'Radio Jockey';
        const photo = rj.photoUrl || rj.photo || 'images/host_default.jpg';
        const bio = window.RadioUtils?.escapeHtml(rj.bio) || rj.bio || '';

        return `
          <div class="glass-card rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all group">
            <div class="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-2 border-primary/30 p-1">
              <img src="${photo}" alt="${name}" class="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform" loading="lazy" />
            </div>
            <h4 class="text-lg font-bold text-on-surface">${name}</h4>
            <p class="text-xs font-medium text-primary mb-2">${desig}</p>
            <p class="text-xs text-on-surface-variant line-clamp-2">${bio}</p>
          </div>`;
      }).join('');
    },
  };
})();
