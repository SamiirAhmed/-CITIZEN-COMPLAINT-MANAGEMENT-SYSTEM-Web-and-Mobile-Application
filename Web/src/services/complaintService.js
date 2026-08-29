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

export async function listComplaints({ search = '', status = '', category = '' } = {}) {
  const response = await apiRequest(
    `/complaints/admin/all${buildQuery({ search, status, category })}`
  );
  return response?.data?.complaints || [];
}

export async function getComplaintById(id) {
  const response = await apiRequest(`/complaints/admin/${id}`);
  return response?.data || null;
}

export async function createComplaint(payload) {
  const response = await apiRequest('/complaints/admin', {
    method: 'POST',
    body: payload,
  });
  return response?.data?.complaint;
}

export async function updateComplaint(id, payload) {
  const response = await apiRequest(`/complaints/admin/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return response?.data?.complaint;
}

export async function deleteComplaint(id) {
  const response = await apiRequest(`/complaints/admin/${id}`, {
    method: 'DELETE',
  });
  return response;
}

export async function reviewComplaint(id, payload) {
  const response = await apiRequest(`/complaints/admin/${id}/review`, {
    method: 'PATCH',
    body: payload,
  });
  return response?.data?.complaint;
}

export async function createOBFromComplaint(id, payload = {}) {
  const response = await apiRequest(`/complaints/admin/${id}/ob`, {
    method: 'POST',
    body: payload,
  });
  return response?.data?.ob;
}
