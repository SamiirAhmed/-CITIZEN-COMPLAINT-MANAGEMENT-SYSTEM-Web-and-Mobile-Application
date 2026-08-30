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

export async function listRegions() {
  const response = await apiRequest('/geography/regions', { auth: false });
  return response?.data?.regions || [];
}

export async function listDistricts(region) {
  const response = await apiRequest(`/geography/districts${buildQuery({ region })}`, {
    auth: false,
  });
  return response?.data?.districts || [];
}

export async function listVillages(region, district) {
  const response = await apiRequest(
    `/geography/villages${buildQuery({ region, district })}`,
    { auth: false }
  );
  return response?.data?.villages || [];
}

export async function listAreas(region, district, village) {
  const response = await apiRequest(
    `/geography/areas${buildQuery({ region, district, village })}`,
    { auth: false }
  );
  return response?.data?.areas || [];
}

export async function listGeographyTable({ search = '' } = {}) {
  const response = await apiRequest(`/admin/geography${buildQuery({ search })}`);
  return response?.data?.locations || [];
}
