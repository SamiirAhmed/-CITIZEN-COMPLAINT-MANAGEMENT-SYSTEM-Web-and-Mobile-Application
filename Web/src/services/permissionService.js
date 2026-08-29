import { apiRequest } from './apiClient';

export async function getPermissionsAvailability() {
  const response = await apiRequest('/admin/permissions/availability');
  return response?.data || { supported: false, message: 'Permissions module is not available yet.' };
}
