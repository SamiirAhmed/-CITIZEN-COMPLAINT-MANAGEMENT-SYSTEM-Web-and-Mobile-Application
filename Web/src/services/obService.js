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

export async function listOBRecords({ search = '', status = '' } = {}) {
  const response = await apiRequest(`/ob/staff${buildQuery({ search, status })}`);
  return response?.data?.records || [];
}

export async function getOBById(id) {
  const response = await apiRequest(`/ob/staff/${id}`);
  return response?.data?.record || null;
}

export async function assignOfficer(id, officerId) {
  const response = await apiRequest(`/ob/admin/${id}/assign`, {
    method: 'PATCH',
    body: { officerId },
  });
  return response?.data?.ob;
}

export async function updateOBStatus(id, payload) {
  const response = await apiRequest(`/ob/admin/${id}/status`, {
    method: 'PATCH',
    body: payload,
  });
  return response?.data?.ob;
}

export async function updateInvestigation(id, payload) {
  const response = await apiRequest(`/ob/police/${id}/investigation`, {
    method: 'PATCH',
    body: payload,
  });
  return response?.data?.ob;
}

export async function deleteOBRecord(id) {
  const response = await apiRequest(`/ob/admin/${id}`, {
    method: 'DELETE',
  });
  return response;
}
