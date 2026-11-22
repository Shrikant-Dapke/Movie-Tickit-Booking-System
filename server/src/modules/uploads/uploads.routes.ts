import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { asyncHandler, badRequest, ok } from '../../lib/http.js';

export const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, done) => done(null, uploadsDir),
  filename: (_req, file, done) => {
    const extension = path.extname(file.originalname).toLowerCase();
    done(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, done) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return done(badRequest('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
    done(null, true);
  },
});

export const uploadsRouter = Router();
uploadsRouter.use(authenticate, requireAdmin);

uploadsRouter.post(
  '/poster',
  (req, res, next) => upload.single('poster')(req, res, (error: unknown) => (error ? next(badRequest(error instanceof Error ? error.message : 'Upload failed')) : next())),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest('Choose an image file to upload');
    ok(res, { url: `/uploads/${req.file.filename}`, originalName: req.file.originalname }, 'Poster uploaded', 201);
  }),
);
