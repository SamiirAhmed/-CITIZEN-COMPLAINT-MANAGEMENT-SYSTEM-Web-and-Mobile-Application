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

export async function getNotifications(options = {}) {
  const response = await apiRequest(`/notifications${buildQuery(options)}`);
  return {
    unreadCount: response?.data?.unreadCount ?? 0,
    notifications: response?.data?.notifications || [],
    pagination: response?.data?.pagination,
  };
}

export async function getSecurityAlerts(filters = {}) {
  return getNotifications({ ...filters, security: '1' });
}

export async function markNotificationRead(id) {
  const response = await apiRequest(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
  return response?.data?.notification;
}

export async function markAllNotificationsRead({ securityOnly = false } = {}) {
  return apiRequest(`/notifications/read-all${securityOnly ? '?security=1' : ''}`, {
    method: 'PATCH',
  });
}
