"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_controller_1 = require("../controllers/media.controller");
const upload_1 = require("../middlewares/upload");
const auth_1 = require("../middlewares/auth");
const audit_1 = require("../middlewares/audit");
const router = (0, express_1.Router)();
// Signed direct Cloudinary upload credentials
router.get('/signature', media_controller_1.getUploadSignature);
// Record direct Cloudinary upload in database
router.post('/record', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']), media_controller_1.recordUploadedMedia);
// Upload media asset via server proxy to Cloudinary (Staff/Admin)
router.post('/upload', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']), upload_1.upload.single('file'), (0, audit_1.auditLog)('UPLOAD', 'Media'), media_controller_1.uploadMedia);
// List media assets (Public or Staff)
router.get('/', media_controller_1.listMedia);
// Get single media asset by ID
router.get('/:id', media_controller_1.getMediaById);
// Delete media asset from Cloudinary & DB (Admin only)
router.delete('/:id', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), (0, audit_1.auditLog)('MEDIA_DELETE', 'Media'), media_controller_1.deleteMedia);
exports.default = router;
