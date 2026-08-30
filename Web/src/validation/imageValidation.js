const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024;

export function validateProfileImageFile(file, { required = false } = {}) {
  if (!file) {
    if (required) {
      return { ok: false, message: 'Profile image is required.' };
    }
    return { ok: true, message: '' };
  }

  const type = String(file.type || '').toLowerCase();
  if (!ALLOWED_TYPES.has(type)) {
    return { ok: false, message: 'Profile image must be a JPEG, PNG, or WebP file.' };
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, message: 'Profile image must be 2MB or smaller.' };
  }

  return { ok: true, message: '' };
}

export { ALLOWED_TYPES, MAX_BYTES };
