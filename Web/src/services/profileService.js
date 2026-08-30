<<<<<<< HEAD
﻿import { apiRequest, getStoredToken, setSession } from './apiClient';

export async function getCurrentUser() {
=======
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
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
  const response = await apiRequest('/auth/me');
  return response?.data?.user || null;
}

<<<<<<< HEAD
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
=======
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
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
}
