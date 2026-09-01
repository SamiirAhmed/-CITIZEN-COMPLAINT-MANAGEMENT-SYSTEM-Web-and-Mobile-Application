import { apiRequest } from './apiClient';
import { DEFAULT_REGION } from '../constants/domain';

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

/** List Banaadir districts by default. */
export async function listDistricts(region = DEFAULT_REGION) {
  const response = await apiRequest(
    `/geography/districts${buildQuery({ region })}`,
    { auth: false }
  );
  const raw = response?.data?.districts || response?.data?.names || [];
  return raw.map((item) =>
    typeof item === 'string'
      ? { district: item, region, label: item }
      : {
          district: item.district,
          region: item.region || region,
          label: item.label || item.district,
        }
  );
}

export async function listVillages(region, district) {
  const response = await apiRequest(
    `/geography/villages${buildQuery({ region: region || DEFAULT_REGION, district })}`,
    { auth: false }
  );
  return response?.data?.villages || [];
}

export async function listAreas(region, district, village) {
  const response = await apiRequest(
    `/geography/areas${buildQuery({
      region: region || DEFAULT_REGION,
      district,
      village,
    })}`,
    { auth: false }
  );
  return response?.data?.areas || [];
}

export async function listGeographyTable({ search = '', region = DEFAULT_REGION } = {}) {
  const response = await apiRequest(
    `/admin/geography${buildQuery({ search, region })}`
  );
  return response?.data?.locations || [];
}

export async function createGeography(payload) {
  const response = await apiRequest('/admin/geography', {
    method: 'POST',
    body: payload,
  });
  return response?.data?.location;
}

export async function updateGeography(id, payload) {
  const response = await apiRequest(`/admin/geography/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return response?.data?.location;
}

export async function deleteGeography(id) {
  const response = await apiRequest(`/admin/geography/${id}`, {
    method: 'DELETE',
  });
  return response;
}
