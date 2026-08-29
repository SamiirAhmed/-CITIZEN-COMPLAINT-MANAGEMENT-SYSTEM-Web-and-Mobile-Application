import { apiRequest } from './apiClient';

export async function getPermissionsAvailability() {
  const response = await apiRequest('/admin/permissions/availability');
  return (
    response?.data || {
      supported: false,
      message: 'Permissions module is not available yet.',
      modules: [],
    }
  );
}

export async function getPoliceUsersForPermissions() {
  const response = await apiRequest('/admin/permissions/police-users');
  return response?.data?.users || [];
}

export async function getUserPermissions(userId) {
  const response = await apiRequest(`/admin/permissions/users/${userId}`);
  return response?.data || { permissions: [], modules: [], user: null };
}

export async function updateUserPermissions(userId, permissions) {
  const response = await apiRequest(`/admin/permissions/users/${userId}`, {
    method: 'PUT',
    body: { permissions },
  });
  return response?.data || null;
}
