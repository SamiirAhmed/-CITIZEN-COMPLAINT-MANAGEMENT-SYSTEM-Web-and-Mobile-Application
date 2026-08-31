import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const EVIDENCE_DIR = path.join(__dirname, '../../uploads/evidence');

const IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const DOCUMENT_MIME = new Set(['application/pdf']);

const ALLOWED_MIME = new Set([...IMAGE_MIME, ...VIDEO_MIME, ...DOCUMENT_MIME]);

const ALLOWED_EXT = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.mp4',
  '.webm',
  '.mov',
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25MB (supports short videos)
const MAX_FILES = 5;

fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, EVIDENCE_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
    const safeExt = ALLOWED_EXT.has(ext) ? ext : '.bin';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `evidence-${unique}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(String(file.mimetype || '').toLowerCase())) {
    const error = new Error(
      'Evidence must be an image (JPEG, PNG, WebP), video (MP4, WebM, MOV), or PDF.'
    );
    error.statusCode = 400;
    return cb(error);
  }
  return cb(null, true);
}

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_BYTES, files: MAX_FILES },
});

function handleUploadError(err, res) {
  if (!err) return false;
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'Evidence file must be 25MB or smaller.',
      });
      return true;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        message: `You can upload at most ${MAX_FILES} evidence files.`,
      });
      return true;
    }
    res.status(400).json({
      success: false,
      message: err.message || 'Invalid evidence upload.',
    });
    return true;
  }
  res.status(err.statusCode || 400).json({
    success: false,
    message: err.message || 'Invalid evidence upload.',
  });
  return true;
}

export const uploadEvidenceOptional = (req, res, next) => {
  uploader.single('evidence')(req, res, (err) => {
    if (handleUploadError(err, res)) return undefined;
    return next();
  });
};

export const uploadComplaintEvidenceOptional = (req, res, next) => {
  uploader.array('evidence', MAX_FILES)(req, res, (err) => {
    if (handleUploadError(err, res)) return undefined;
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

export function mapUploadedEvidenceFiles(files = [], createdBy = null) {
  return (files || []).map((file) => ({
    fileName: file.filename || '',
    originalName: file.originalname || '',
    mimeType: file.mimetype || '',
    url: evidencePublicPath(file.filename),
    note: '',
    createdBy: createdBy || null,
    createdAt: new Date(),
  }));
}

export { IMAGE_MIME, VIDEO_MIME, MAX_FILES, MAX_BYTES };
