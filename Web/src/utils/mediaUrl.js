const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/** Origin hosting /uploads (strip trailing /api) */
export function getApiOrigin() {
  const base = String(API_BASE_URL);
  if (base.startsWith('/')) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return base.replace(/\/api\/?$/, '');
}

/** Resolve Backend profileImage path to a browser-loadable URL */
export function resolveMediaUrl(path) {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const origin = getApiOrigin();
  return `${origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

export { API_BASE_URL };
