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
  return {
    logs: response?.data?.logs || [],
    pagination: response?.data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 },
  };
}

export async function getAuditLogById(id) {
  const response = await apiRequest(`/admin/audit-logs/${id}`);
  return response?.data?.log || null;
}

export async function getAuthTimeline(filters = {}) {
  const response = await apiRequest(`/admin/audit-logs/timeline${buildQuery(filters)}`);
  return response?.data?.events || [];
}
