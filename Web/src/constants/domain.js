/** Default region for citizen-facing location selection. */
export const DEFAULT_REGION = 'Banaadir';

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

/** Terminal states — no assign, re-open, or active workflow updates. */
export const FINAL_OB_STATUSES = ['Resolved'];

export function isClosedOBStatus(status) {
  return status === 'Closed';
}

export function isFinalOBStatus(status) {
  return FINAL_OB_STATUSES.includes(status);
}

export function canAssignOB(record) {
  const status = record?.status;
  if (!status) return false;
  return !isClosedOBStatus(status) && !isFinalOBStatus(status);
}

export function canUpdateOBWorkflow(record) {
  return canAssignOB(record);
}

export function canReopenOB(record) {
  return isClosedOBStatus(record?.status);
}

export function canDeleteOB(record) {
  return !isClosedOBStatus(record?.status);
}
