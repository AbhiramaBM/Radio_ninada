"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const upload_1 = require("../middlewares/upload");
const auth_1 = require("../middlewares/auth");
const index_1 = require("../config/index");
const router = (0, express_1.Router)();
// POST /api/upload - Upload single or multiple media files
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']), upload_1.upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        const absoluteUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;
        return res.status(201).json({
            success: true,
            message: 'Media file uploaded successfully to server storage',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                url: fileUrl,
                absoluteUrl,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/upload/dump - List all dumped files and storage statistics
router.get('/dump', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), async (req, res, next) => {
    try {
        const uploadDir = index_1.config.uploadDir;
        if (!fs_1.default.existsSync(uploadDir)) {
            return res.json({ success: true, data: { totalFiles: 0, totalSize: 0, files: [] } });
        }
        const fileNames = fs_1.default.readdirSync(uploadDir);
        let totalSize = 0;
        const files = fileNames.map((name) => {
            const filePath = path_1.default.join(uploadDir, name);
            const stats = fs_1.default.statSync(filePath);
            totalSize += stats.size;
            return {
                name,
                size: stats.size,
                createdAt: stats.birthtime,
                url: `/uploads/${name}`,
                absoluteUrl: `${req.protocol}://${req.get('host')}/uploads/${name}`,
            };
        });
        return res.json({
            success: true,
            data: {
                totalFiles: files.length,
                totalSizeBytes: totalSize,
                totalSizeMb: (totalSize / (1024 * 1024)).toFixed(2),
                files: files.reverse(),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
