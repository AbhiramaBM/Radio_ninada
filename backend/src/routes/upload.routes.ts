import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { upload } from '../middlewares/upload';
import { authenticate, requireRole } from '../middlewares/auth';
import { config } from '../config/index';

const router = Router();

// POST /api/upload - Upload single or multiple media files
router.post(
  '/',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']),
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/upload/dump - List all dumped files and storage statistics
router.get('/dump', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadDir = config.uploadDir;
    if (!fs.existsSync(uploadDir)) {
      return res.json({ success: true, data: { totalFiles: 0, totalSize: 0, files: [] } });
    }

    const fileNames = fs.readdirSync(uploadDir);
    let totalSize = 0;

    const files = fileNames.map((name) => {
      const filePath = path.join(uploadDir, name);
      const stats = fs.statSync(filePath);
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
  } catch (error) {
    next(error);
  }
});

export default router;
