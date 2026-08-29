import { apiRequest } from './apiClient';

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value).trim());
    }
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

export async function listUsers({ search = '', role = '', status = '' } = {}) {
  const response = await apiRequest(`/admin/users${buildQuery({ search, role, status })}`);
  return response?.data?.users || [];
}

export async function getUserById(id) {
  const response = await apiRequest(`/admin/users/${id}`);
  return response?.data?.user || null;
}

export async function registerPolice(payload) {
  const response = await apiRequest('/admin/users/police', {
    method: 'POST',
    body: payload,
  });
  return response?.data?.user;
}

export async function updateUser(id, payload) {
  const response = await apiRequest(`/admin/users/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return response?.data?.user;
}

export async function setUserStatus(id, isActive) {
  const response = await apiRequest(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: { isActive },
  });
  return response?.data?.user;
}
