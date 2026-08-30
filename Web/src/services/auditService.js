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

export async function listAuditLogs(filters = {}) {
  const response = await apiRequest(`/admin/audit-logs${buildQuery(filters)}`);
  return response?.data?.logs || [];
}
