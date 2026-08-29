import { apiRequest, clearSession, setSession } from './apiClient';

const STAFF_ROLES = new Set(['admin', 'police']);

export async function login(email, password) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });

  const token = response?.data?.token;
  const user = response?.data?.user;

  if (!token || !user) {
    throw new Error('Invalid login response from server.');
  }

  if (!STAFF_ROLES.has(user.role)) {
    throw new Error('Citizen accounts cannot access the SPO admin portal.');
  }

  setSession(token, user);
  return { token, user, message: response.message };
}

export function logout() {
  clearSession();
}

export function isStaffUser(user) {
  return Boolean(user && STAFF_ROLES.has(user.role));
}
