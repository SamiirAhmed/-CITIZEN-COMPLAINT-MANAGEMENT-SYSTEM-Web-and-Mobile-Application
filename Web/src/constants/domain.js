export const COMPLAINT_STATUSES = [
  'Submitted',
  'Under Review',
  'Verified',
  'OB Created',
  'Under Investigation',
  'Investigation Completed',
  'Resolved',
  'Closed',
  'Rejected',
  'Reopened',
];

export const OB_STATUSES = [
  'Opened',
  'Assigned',
  'Under Investigation',
  'Investigation Completed',
  'Resolved',
  'Closed',
  'Reopened',
];

export function toDateInputValue(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  } catch {
    return '';
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

export function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
}

export function getRecordId(record) {
  return record?.id || record?._id || '';
}
