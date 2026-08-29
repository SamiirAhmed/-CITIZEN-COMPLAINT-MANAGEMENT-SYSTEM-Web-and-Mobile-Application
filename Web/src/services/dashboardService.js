import { apiRequest } from './apiClient';

export async function getDashboard() {
  const response = await apiRequest('/admin/dashboard');
  return (
    response?.data || {
      summary: {},
      recentActivities: [],
    }
  );
}
