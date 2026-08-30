const STATUS_MAP = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'danger' },
  submitted: { label: 'Submitted', tone: 'info' },
  'under review': { label: 'Under Review', tone: 'warning' },
  verified: { label: 'Verified', tone: 'info' },
  'ob created': { label: 'OB Created', tone: 'info' },
  'under investigation': { label: 'Under Investigation', tone: 'warning' },
  'investigation completed': { label: 'Investigation Completed', tone: 'success' },
  resolved: { label: 'Resolved', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'danger' },
  reopened: { label: 'Reopened', tone: 'warning' },
  opened: { label: 'Opened', tone: 'info' },
  open: { label: 'Open', tone: 'warning' },
<<<<<<< HEAD
  assigned: { label: 'Assigned', tone: 'info' },
  investigating: { label: 'Investigating', tone: 'warning' },
  pending: { label: 'Pending', tone: 'warning' },
  low: { label: 'LOW', tone: 'neutral' },
  medium: { label: 'MEDIUM', tone: 'info' },
  high: { label: 'HIGH', tone: 'warning' },
  critical: { label: 'CRITICAL', tone: 'danger' },
=======
  pending: { label: 'Pending', tone: 'warning' },
  assigned: { label: 'Assigned', tone: 'info' },
  investigating: { label: 'Investigating', tone: 'warning' },
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9
};

export default function StatusBadge({ status }) {
  const key = String(status || '').trim().toLowerCase();
  const mapped = STATUS_MAP[key] || {
    label: status || 'Unknown',
    tone: 'neutral',
  };

  return <span className={`status-badge status-badge--${mapped.tone}`}>{mapped.label}</span>;
}
