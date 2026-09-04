"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const podcast_controller_1 = require("../controllers/podcast.controller");
const auth_1 = require("../middlewares/auth");
const audit_1 = require("../middlewares/audit");
const router = (0, express_1.Router)();
// Public podcast endpoints
router.get('/', podcast_controller_1.getPodcasts);
router.get('/:slug', podcast_controller_1.getPodcastBySlug);
router.post('/episodes/:id/download', podcast_controller_1.incrementDownload);
// Staff/Admin endpoints
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']), (0, audit_1.auditLog)('CREATE', 'Podcast'), podcast_controller_1.createPodcast);
router.post('/:id/episodes', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']), (0, audit_1.auditLog)('CREATE', 'PodcastEpisode'), podcast_controller_1.addEpisode);
router.delete('/:id', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), (0, audit_1.auditLog)('DELETE', 'Podcast'), podcast_controller_1.deletePodcast);
exports.default = router;
