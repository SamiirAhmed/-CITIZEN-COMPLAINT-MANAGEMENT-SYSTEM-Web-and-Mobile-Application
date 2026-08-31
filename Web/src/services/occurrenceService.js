import { apiRequest, API_BASE_URL, getStoredToken } from './apiClient';

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

export async function getOccurrenceMeta() {
  const response = await apiRequest('/ob/staff/meta');
  return response?.data || { statuses: [], priorities: [], categories: [] };
}

export async function listOccurrences(params = {}) {
  const response = await apiRequest(`/ob/staff${buildQuery(params)}`);
  return {
    records: response?.data?.records || [],
    pagination: response?.data?.pagination || { page: 1, limit: 25, total: 0, pages: 1 },
  };
}

export async function getOccurrenceById(id) {
  const response = await apiRequest(`/ob/staff/${id}`);
  return response?.data?.record || null;
}

export async function createOccurrence(payload) {
  console.info('[OB] fetch POST', `${API_BASE_URL}/ob/staff`, payload);

  const response = await apiRequest('/ob/staff', {
    method: 'POST',
    body: payload,
  });

  console.info('[OB] fetch response', response);

  if (!response?.success || !response?.data?.record) {
    const error = new Error(
      response?.message || 'Failed to save occurrence. Please try again.'
    );
    console.error('createOccurrence unexpected response:', response);
    throw error;
  }

  return response.data.record;
}

export async function updateOccurrence(id, payload) {
  const response = await apiRequest(`/ob/staff/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return response?.data?.record;
}

export async function changeOccurrenceStatus(id, status, note = '') {
  const response = await apiRequest(`/ob/staff/${id}/status`, {
    method: 'PATCH',
    body: { status, note },
  });
  return response?.data?.record;
}

export async function assignOccurrence(id, officerId) {
  const response = await apiRequest(`/ob/admin/${id}/assign`, {
    method: 'PATCH',
    body: { officerId },
  });
  return response?.data?.record;
}

export async function closeOccurrence(id, note = '', outcome = '') {
  const response = await apiRequest(`/ob/staff/${id}/close`, {
    method: 'PATCH',
    body: { note, outcome },
  });
  return response?.data?.record;
}

export async function reopenOccurrence(id, note = '') {
  const response = await apiRequest(`/ob/staff/${id}/reopen`, {
    method: 'PATCH',
    body: { note },
  });
  return response?.data?.record;
}

export async function setOccurrenceActive(id, isActive) {
  const response = await apiRequest(`/ob/admin/${id}/active`, {
    method: 'PATCH',
    body: { isActive: Boolean(isActive) },
  });
  return response?.data?.ob;
}

/** @deprecated Use setOccurrenceActive */
export async function deleteOccurrence(id) {
  return setOccurrenceActive(id, false);
}

export async function getOccurrenceStats(params = {}) {
  const response = await apiRequest(`/ob/staff/stats${buildQuery(params)}`);
  return response?.data || null;
}

export async function exportOccurrencesCsv(params = {}) {
  const token = getStoredToken();
  const url = `${API_BASE_URL}/ob/staff/export${buildQuery(params)}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let message = 'Unable to export occurrences.';
    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `ob-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
