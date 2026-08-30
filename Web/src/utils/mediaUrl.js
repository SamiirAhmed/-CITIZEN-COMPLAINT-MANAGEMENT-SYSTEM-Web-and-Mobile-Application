const API_BASE_URL = '/api';

/** Origin hosting /uploads (strip trailing /api) */
export function getApiOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/** Resolve Backend profileImage path to a browser-loadable URL */
export function resolveMediaUrl(path) {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) && !/apeal\.yahyeali\.com/i.test(trimmed)) {
    return trimmed;
  }
  const origin = getApiOrigin();
  const relative = trimmed.replace(/^https?:\/\/[^/]+/i, '');
  return `${origin}${relative.startsWith('/') ? relative : `/${relative}`}`;
}

export { API_BASE_URL };
