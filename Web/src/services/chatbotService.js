import { apiRequest } from './apiClient';

export async function getChatbotStatus() {
  const response = await apiRequest('/admin/chatbot/status');
  return response?.data || { configured: false };
}

export async function askChatbot({ message, history = [] }) {
  const response = await apiRequest('/admin/chatbot/ask', {
    method: 'POST',
    body: { message, history },
  });
  return response?.data || null;
}

export async function getPoliceChatbotStatus() {
  const response = await apiRequest('/ob/staff/chatbot/status');
  return response?.data || { configured: false };
}

export async function askPoliceChatbot({ message, history = [] }) {
  const response = await apiRequest('/ob/staff/chatbot/ask', {
    method: 'POST',
    body: { message, history },
  });
  return response?.data || null;
}
