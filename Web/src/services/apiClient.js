const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const TOKEN_KEY = 'spo_admin_token';
const USER_KEY = 'spo_admin_user';

function resolveAccessSource() {
  if (typeof window === 'undefined') return 'Web';
  if (window.location.pathname.startsWith('/police')) return 'Police Web';
  return 'Admin Web';
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

function toClientErrorMessage(message, fallback) {
  const text = String(message || fallback || 'Request failed.');
  if (
    /buffering timed out|users\.findOne|MongoServerError|MongooseError|ECONNREFUSED|server selection timed out/i.test(
      text
    )
  ) {
    return 'Authentication service is temporarily unavailable. Please try again.';
  }
  return text;
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    auth = true,
    formData = null,
  } = options;

  const requestHeaders = {
    Accept: 'application/json',
    'X-Access-Source': resolveAccessSource(),
    ...headers,
  };

  if (body !== undefined && !formData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: formData
        ? formData
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  } catch {
    const error = new Error('Unable to reach the server. Please try again.');
    error.status = 0;
    throw error;
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (response.status === 401) {
    if (auth) {
      clearSession();
      redirectToLogin();
    }
    const error = new Error(
      toClientErrorMessage(payload?.message, 'Session expired. Please sign in again.')
    );
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(toClientErrorMessage(payload?.message, 'Request failed.'));
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
}

export { API_BASE_URL, TOKEN_KEY, USER_KEY };
