export default function RoleBadge({ role }) {
  const value = String(role || '').trim().toLowerCase();
  const label = value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown';
  const tone = value === 'admin' ? 'admin' : value === 'police' ? 'police' : 'default';

  return <span className={`role-badge role-badge--${tone}`}>{label}</span>;
}
