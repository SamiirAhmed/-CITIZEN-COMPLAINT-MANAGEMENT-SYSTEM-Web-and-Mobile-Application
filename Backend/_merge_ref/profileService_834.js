import { apiRequest, getStoredToken, setSession } from './apiClient';

function toFormData(fields = {}, file = null) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, String(value));
  });
  if (file) {
    form.append('profileImage', file);
  }
  return form;
}

export async function getMyProfile() {
  const response = await apiRequest('/auth/me');
  return response?.data?.user || null;
}

export async function updateMyProfile(payload) {
  const { profileImageFile, ...fields } = payload;
  let response;

  if (profileImageFile) {
    response = await apiRequest('/auth/profile', {
      method: 'PUT',
      formData: toFormData(fields, profileImageFile),
    });
  } else {
    response = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: fields,
    });
  }

  const user = response?.data?.user || null;
  if (user) {
    setSession(getStoredToken(), user);
  }
  return user;
}

export async function changeMyPassword({ currentPassword, newPassword, confirmPassword }) {
  const response = await apiRequest('/auth/change-password', {
    method: 'PUT',
    body: { currentPassword, newPassword, confirmPassword },
  });
  return response?.message || 'Password changed successfully.';
}
