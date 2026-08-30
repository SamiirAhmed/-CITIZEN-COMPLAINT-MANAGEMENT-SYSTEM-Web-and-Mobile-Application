import { apiRequest, getStoredToken, setSession } from './apiClient';

export async function getCurrentUser() {
  const response = await apiRequest('/auth/me');
  return response?.data?.user || null;
}

export async function updateProfile(payload) {
  const response = await apiRequest('/auth/profile', {
    method: 'PUT',
    body: payload,
  });
  const user = response?.data?.user;
  if (user) {
    const token = getStoredToken();
    if (token) {
      setSession(token, user);
    }
  }
  return {
    user,
    message: response?.message || 'Profile updated successfully!',
  };
}

export async function changePassword(payload) {
  const response = await apiRequest('/auth/change-password', {
    method: 'PUT',
    body: payload,
  });
  return {
    message: response?.message || 'Password changed successfully.',
  };
}
