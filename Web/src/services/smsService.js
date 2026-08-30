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

export async function getSmsBalance() {
  const response = await apiRequest('/admin/sms/balance');
  return {
    balance: response?.data?.balance ?? null,
    status: response?.data?.status || 'unavailable',
    provider: response?.data?.provider || 'Tabaarak',
    accountType: response?.data?.accountType || '',
    configured: response?.data?.configured !== false,
    message: response?.message || '',
    success: response?.success !== false,
  };
}

export async function getSmsStats() {
  const response = await apiRequest('/admin/sms/stats');
  return {
    policeTotal: response?.data?.policeTotal || 0,
    policeActive: response?.data?.policeActive || 0,
    historyCount: response?.data?.historyCount || 0,
    policeUsers: response?.data?.policeUsers || [],
  };
}

export async function listSmsRecipients(params = {}) {
  const response = await apiRequest(`/admin/sms/recipients${buildQuery(params)}`);
  return {
    recipients: response?.data?.recipients || [],
    pagination: response?.data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 },
  };
}

export async function sendSms(payload) {
  const response = await apiRequest('/admin/sms/send', {
    method: 'POST',
    body: payload,
  });
  return {
    message: response?.message || '',
    data: response?.data || null,
    success: response?.success !== false,
  };
}

export async function listSmsHistory(params = {}) {
  const response = await apiRequest(`/admin/sms/history${buildQuery(params)}`);
  return {
    records: response?.data?.records || [],
    pagination: response?.data?.pagination || { page: 1, limit: 15, total: 0, pages: 1 },
  };
}
