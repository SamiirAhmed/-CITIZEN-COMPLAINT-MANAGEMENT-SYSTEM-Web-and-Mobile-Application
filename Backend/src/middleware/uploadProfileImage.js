import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
export const PROFILES_DIR = path.join(UPLOADS_ROOT, 'profiles');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

fs.mkdirSync(PROFILES_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PROFILES_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profile-${unique}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(String(file.mimetype || '').toLowerCase())) {
    const error = new Error('Profile image must be a JPEG, PNG, or WebP file.');
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

/** Optional single-file middleware field name: profileImage */
export const uploadProfileImageOptional = (req, res, next) => {
  uploader.single('profileImage')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Profile image must be 2MB or smaller.',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid profile image upload.',
        });
      }
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Invalid profile image upload.',
      });
    }
    return next();
  });
};

export function profileImagePublicPath(filename) {
  if (!filename) return '';
  return `/uploads/profiles/${path.basename(filename)}`;
}

export function absoluteDiskPathFromPublic(publicPath) {
  if (!publicPath || typeof publicPath !== 'string') return null;
  if (!publicPath.startsWith('/uploads/profiles/')) return null;
  const base = path.basename(publicPath);
  return path.join(PROFILES_DIR, base);
}

export function removeProfileImageFile(publicPath) {
  const disk = absoluteDiskPathFromPublic(publicPath);
  if (!disk) return;
  try {
    if (fs.existsSync(disk)) fs.unlinkSync(disk);
  } catch {
    // ignore cleanup errors
  }
}

export { ALLOWED_MIME, MAX_BYTES };
