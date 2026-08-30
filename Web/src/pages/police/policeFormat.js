export function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
}

export function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

export function matchesOBSearch(record, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    record?.obNumber,
    record?.status,
    record?.complaint?.complaintNumber,
    record?.complaint?.category,
    record?.citizen?.name,
    record?.citizen?.niraId,
    record?.citizenSummary,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function getRecordSortValue(record, key) {
  switch (key) {
    case 'id':
      return record?.obNumber || '';
    case 'date':
      return new Date(
        record?.createdAt || record?.assignedAt || record?.updatedAt || 0
      ).getTime();
    case 'invDate':
      return new Date(
        record?.investigationStartedAt || record?.updatedAt || record?.createdAt || 0
      ).getTime();
    case 'type':
      return record?.complaint?.category || '';
    case 'case':
      return record?.complaint?.complaintNumber || '';
    case 'description':
      return record?.citizenSummary || record?.complaint?.description || '';
    case 'officer':
      return record?.assignedOfficer?.name || '';
    case 'status':
      return record?.status || '';
    default:
      return '';
  }
}

export function sortRecords(records, key, direction) {
  const dir = direction === 'desc' ? -1 : 1;
  return [...records].sort((a, b) => {
    const av = getRecordSortValue(a, key);
    const bv = getRecordSortValue(b, key);
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * dir;
    }
    return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }) * dir;
  });
}

export function paginateRecords(records, page, pageSize) {
  const total = records.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return {
    rows: records.slice(start, start + pageSize),
    total,
    page: current,
    pageCount,
    pageSize,
  };
}
