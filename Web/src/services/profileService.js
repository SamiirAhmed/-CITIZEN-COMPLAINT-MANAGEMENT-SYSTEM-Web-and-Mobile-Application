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

export const getCurrentUser = getMyProfile;

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

export async function updateProfile(payload) {
  const user = await updateMyProfile(payload);
  return {
    user,
    message: 'Profile updated successfully!',
  };
}

export async function changeMyPassword({ currentPassword, newPassword, confirmPassword }) {
  const response = await apiRequest('/auth/change-password', {
    method: 'PUT',
    body: { currentPassword, newPassword, confirmPassword },
  });
  const user = response?.data?.user || null;
  if (user) {
    setSession(getStoredToken(), user);
  }
  return user;
}

export async function changePassword(payload) {
  const user = await changeMyPassword(payload);
  return {
    user,
    message: 'Password changed successfully.',
  };
}
