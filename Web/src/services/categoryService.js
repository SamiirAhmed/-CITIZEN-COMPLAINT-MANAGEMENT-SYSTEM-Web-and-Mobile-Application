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

export async function listCategories({ search = '', status = '' } = {}) {
  const response = await apiRequest(
    `/admin/categories${buildQuery({ search, status })}`
  );
  return response?.data?.categories || [];
}

export async function createCategory(payload) {
  const response = await apiRequest('/admin/categories', {
    method: 'POST',
    body: payload,
  });
  return response?.data?.category;
}

export async function updateCategory(id, payload) {
  const response = await apiRequest(`/admin/categories/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return response?.data?.category;
}

export async function setCategoryStatus(id, isActive) {
  const response = await apiRequest(`/admin/categories/${id}/status`, {
    method: 'PATCH',
    body: { isActive },
  });
  return response?.data?.category;
}
