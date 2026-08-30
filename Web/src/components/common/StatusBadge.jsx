const STATUS_MAP = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'danger' },
  submitted: { label: 'Submitted', tone: 'info' },
  'under review': { label: 'Under Review', tone: 'warning' },
  verified: { label: 'Verified', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
  open: { label: 'Open', tone: 'warning' },
  opened: { label: 'Opened', tone: 'warning' },
  pending: { label: 'Pending', tone: 'warning' },
  assigned: { label: 'Assigned', tone: 'info' },
  investigating: { label: 'Investigating', tone: 'warning' },
  'under investigation': { label: 'Under Investigation', tone: 'warning' },
  'investigation completed': { label: 'Investigation Completed', tone: 'info' },
  reopened: { label: 'Reopened', tone: 'danger' },
};

export default function StatusBadge({ status }) {
  const key = String(status || '').trim().toLowerCase();
  const mapped = STATUS_MAP[key] || {
    label: status || 'Unknown',
    tone: 'neutral',
  };

  return <span className={`status-badge status-badge--${mapped.tone}`}>{mapped.label}</span>;
}
