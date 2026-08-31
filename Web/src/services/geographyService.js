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

/**
 * List districts. Without region → all districts as { district, region, label }.
 * With region → string names (legacy).
 */
export async function listDistricts(region = '') {
  const response = await apiRequest(
    `/geography/districts${buildQuery(region ? { region } : {})}`,
    { auth: false }
  );
  const raw = response?.data?.districts || [];
  if (!region) {
    return raw.map((item) =>
      typeof item === 'string'
        ? { district: item, region: '', label: item }
        : {
            district: item.district,
            region: item.region || '',
            label: item.label || item.district,
          }
    );
  }
  return raw;
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
