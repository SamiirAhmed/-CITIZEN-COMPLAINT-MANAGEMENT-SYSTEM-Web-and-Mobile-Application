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

export async function listCitizens({ search = '', status = '' } = {}) {
  const response = await apiRequest(`/admin/citizens${buildQuery({ search, status })}`);
  return response?.data?.citizens || [];
}

export async function getCitizenById(id) {
  const response = await apiRequest(`/admin/citizens/${id}`);
  return response?.data || null;
}

export async function updateCitizen(id, payload) {
  const { profileImageFile, ...fields } = payload;
  if (profileImageFile) {
    const formData = toFormData(fields, profileImageFile);
    const response = await apiRequest(`/admin/citizens/${id}`, {
      method: 'PUT',
      formData,
    });
    return response?.data?.citizen;
  }
  const response = await apiRequest(`/admin/citizens/${id}`, {
    method: 'PUT',
    body: fields,
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
