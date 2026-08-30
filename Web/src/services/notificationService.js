import { apiRequest } from './apiClient';

export async function getNotifications() {
  const response = await apiRequest('/notifications');
  return {
    unreadCount: response?.data?.unreadCount ?? 0,
    notifications: response?.data?.notifications || [],
  };
}

export async function markNotificationRead(id) {
  const response = await apiRequest(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
  return response?.data?.notification;
}

export async function markAllNotificationsRead() {
  return apiRequest('/notifications/read-all', {
    method: 'PATCH',
  });
}
