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

export async function listCitizens({ search = '', status = '' } = {}) {
  const response = await apiRequest(`/admin/citizens${buildQuery({ search, status })}`);
  return response?.data?.citizens || [];
}

export async function getCitizenById(id) {
  const response = await apiRequest(`/admin/citizens/${id}`);
  return response?.data || null;
}

export async function updateCitizen(id, payload) {
  const response = await apiRequest(`/admin/citizens/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return response?.data?.citizen;
}

export async function setCitizenStatus(id, isActive) {
  const response = await apiRequest(`/admin/citizens/${id}/status`, {
    method: 'PATCH',
    body: { isActive },
  });
  return response?.data?.citizen;
}
