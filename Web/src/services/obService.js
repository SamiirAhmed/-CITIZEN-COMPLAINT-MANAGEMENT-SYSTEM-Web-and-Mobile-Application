import { apiRequest } from './apiClient';

function normalizeRecord(record) {
  if (!record) return null;
  const id = record.id || record._id?.toString?.() || record._id;
  return { ...record, id };
}

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

export async function listStaffOBRecords() {
  const response = await apiRequest('/ob/staff');
  return (response?.data?.records || []).map(normalizeRecord);
}

export async function getStaffOBById(id) {
  const response = await apiRequest(`/ob/staff/${id}`);
  return normalizeRecord(response?.data?.record);
}

export async function listOBRecords({ search = '', status = '' } = {}) {
  const response = await apiRequest(`/ob/staff${buildQuery({ search, status })}`);
  return (response?.data?.records || []).map(normalizeRecord);
}

export async function getOBById(id) {
  const response = await apiRequest(`/ob/staff/${id}`);
  return normalizeRecord(response?.data?.record);
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
  return normalizeRecord(response?.data?.ob);
}

export async function addInvestigationEvidence(id, { file, note } = {}) {
  const formData = new FormData();
  if (note) formData.append('note', note);
  if (file) formData.append('evidence', file);

  const response = await apiRequest(`/ob/police/${id}/evidence`, {
    method: 'POST',
    formData,
  });
  return normalizeRecord(response?.data?.ob);
}

export async function setOBRecordActive(id, isActive) {
  const response = await apiRequest(`/ob/admin/${id}/active`, {
    method: 'PATCH',
    body: { isActive: Boolean(isActive) },
  });
  return response?.data?.ob;
}

/** @deprecated Use setOBRecordActive — soft deactivate instead of hard delete */
export async function deleteOBRecord(id) {
  return setOBRecordActive(id, false);
}
