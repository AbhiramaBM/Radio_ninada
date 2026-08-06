"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gallery_controller_1 = require("../controllers/gallery.controller");
const auth_1 = require("../middlewares/auth");
const upload_1 = require("../middlewares/upload");
const audit_1 = require("../middlewares/audit");
const router = (0, express_1.Router)();
// Resilient file upload handler for both 'file' and 'media' field names or JSON requests
const handleFileUpload = (req, res, next) => {
    upload_1.upload.fields([{ name: 'file', maxCount: 1 }, { name: 'media', maxCount: 1 }])(req, res, (err) => {
        if (err) {
            console.warn('Gallery upload notice:', err.message);
        }
        if (req.files && typeof req.files === 'object') {
            const filesObj = req.files;
            const fileArr = filesObj['file'] || filesObj['media'];
            if (fileArr && fileArr.length > 0) {
                req.file = fileArr[0];
            }
        }
        next();
    });
};
router.get('/', gallery_controller_1.getGallery);
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), handleFileUpload, (0, audit_1.auditLog)('CREATE', 'GalleryItem'), gallery_controller_1.createGalleryItem);
router.delete('/:id', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), (0, audit_1.auditLog)('DELETE', 'GalleryItem'), gallery_controller_1.deleteGalleryItem);
exports.default = router;
