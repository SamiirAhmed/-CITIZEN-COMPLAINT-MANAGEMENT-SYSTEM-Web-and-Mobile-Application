const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/** Origin hosting /uploads (strip trailing /api) */
export function getApiOrigin() {
  return String(API_BASE_URL).replace(/\/api\/?$/, '');
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
