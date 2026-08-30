const STATUS_MAP = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'danger' },
  submitted: { label: 'Submitted', tone: 'info' },
  'under review': { label: 'Under Review', tone: 'warning' },
  verified: { label: 'Verified', tone: 'info' },
  'ob created': { label: 'OB Created', tone: 'info' },
  'under investigation': { label: 'Under Investigation', tone: 'warning' },
  'investigation completed': { label: 'Investigation Completed', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'danger' },
  reopened: { label: 'Reopened', tone: 'warning' },
  opened: { label: 'Opened', tone: 'warning' },
  open: { label: 'Open', tone: 'warning' },
  assigned: { label: 'Assigned', tone: 'info' },
  investigating: { label: 'Investigating', tone: 'warning' },
  opened: { label: 'Opened', tone: 'info' },
  'under investigation': { label: 'Under Investigation', tone: 'warning' },
  'investigation completed': { label: 'Investigation Completed', tone: 'success' },
  reopened: { label: 'Reopened', tone: 'warning' },
};

export default function StatusBadge({ status }) {
  const key = String(status || '').trim().toLowerCase();
  const mapped = STATUS_MAP[key] || {
    label: status || 'Unknown',
    tone: 'neutral',
  };

  return <span className={`status-badge status-badge--${mapped.tone}`}>{mapped.label}</span>;
}
