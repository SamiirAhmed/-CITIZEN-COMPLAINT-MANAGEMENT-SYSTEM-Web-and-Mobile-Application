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

function toComplaintFormData(payload = {}) {
  const form = new FormData();
  const { evidenceFiles = [], ...fields } = payload;

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      form.append(key, String(value));
    }
  });

  (evidenceFiles || []).forEach((file) => {
    if (file) form.append('evidence', file);
  });

  return form;
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
  const hasFiles = Array.isArray(payload?.evidenceFiles) && payload.evidenceFiles.length > 0;
  if (hasFiles) {
    const response = await apiRequest('/complaints/admin', {
      method: 'POST',
      formData: toComplaintFormData(payload),
    });
    return response?.data?.complaint;
  }

  const { evidenceFiles: _files, ...body } = payload || {};
  const response = await apiRequest('/complaints/admin', {
    method: 'POST',
    body,
  });
  return response?.data?.complaint;
}

export async function updateComplaint(id, payload) {
  const hasFiles = Array.isArray(payload?.evidenceFiles) && payload.evidenceFiles.length > 0;
  if (hasFiles) {
    const response = await apiRequest(`/complaints/admin/${id}`, {
      method: 'PUT',
      formData: toComplaintFormData(payload),
    });
    return response?.data?.complaint;
  }

  const { evidenceFiles: _files, ...body } = payload || {};
  const response = await apiRequest(`/complaints/admin/${id}`, {
    method: 'PUT',
    body,
  });
  return response?.data?.complaint;
}

export async function setComplaintActive(id, isActive) {
  const response = await apiRequest(`/complaints/admin/${id}/active`, {
    method: 'PATCH',
    body: { isActive: Boolean(isActive) },
  });
  return response?.data?.complaint;
}

/** @deprecated Use setComplaintActive — soft deactivate instead of hard delete */
export async function deleteComplaint(id) {
  return setComplaintActive(id, false);
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
