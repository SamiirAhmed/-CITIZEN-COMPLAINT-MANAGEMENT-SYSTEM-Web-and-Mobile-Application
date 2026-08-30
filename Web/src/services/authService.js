import { isMobileOnlyUser, isWebUser, isStaffUser } from '../auth/roles';
import { apiRequest, clearSession, setSession } from './apiClient';

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

  if (isMobileOnlyUser(user)) {
    throw new Error('Citizen accounts use the mobile application.');
  }

  if (!isWebUser(user)) {
    throw new Error('This account cannot sign in to the web portal.');
  }

  setSession(token, user);
  return { token, user, message: response.message };
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // Clear local session even if the server call fails.
  }
  clearSession();
}

export { isStaffUser, isWebUser };
