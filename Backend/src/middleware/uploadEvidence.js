import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const EVIDENCE_DIR = path.join(__dirname, '../../uploads/evidence');

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, EVIDENCE_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext)
      ? ext
      : '.bin';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `evidence-${unique}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(String(file.mimetype || '').toLowerCase())) {
    const error = new Error('Evidence must be a JPEG, PNG, WebP, or PDF file.');
    error.statusCode = 400;
    return cb(error);
  }
  return cb(null, true);
}

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_BYTES },
});

export const uploadEvidenceOptional = (req, res, next) => {
  uploader.single('evidence')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Evidence file must be 5MB or smaller.',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid evidence upload.',
        });
      }
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Invalid evidence upload.',
      });
    }
    return next();
  });
};

export function evidencePublicPath(filename) {
  if (!filename) return '';
  return `/uploads/evidence/${path.basename(filename)}`;
}

export function removeEvidenceFile(publicPath) {
  if (!publicPath || typeof publicPath !== 'string') return;
  if (!publicPath.startsWith('/uploads/evidence/')) return;
  const disk = path.join(EVIDENCE_DIR, path.basename(publicPath));
  try {
    if (fs.existsSync(disk)) fs.unlinkSync(disk);
  } catch {
    // ignore cleanup errors
  }
}
