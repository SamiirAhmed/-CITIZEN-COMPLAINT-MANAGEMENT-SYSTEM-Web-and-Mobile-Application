import { apiRequest } from './apiClient';

function normalizeRecord(record) {
  if (!record) return null;
  const id = record.id || record._id?.toString?.() || record._id;
  return { ...record, id };
}

export async function listStaffOBRecords() {
  const response = await apiRequest('/ob/staff');
  return (response?.data?.records || []).map(normalizeRecord);
}

export async function getStaffOBById(id) {
  const response = await apiRequest(`/ob/staff/${id}`);
  return normalizeRecord(response?.data?.record);
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
