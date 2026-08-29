import StatusBadge from '../common/StatusBadge';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

export default function UserDetails({ user }) {
  if (!user) return null;

  return (
    <div className="detail-grid">
      <div>
        <span className="detail-label">Name</span>
        <strong>{user.name}</strong>
      </div>
      <div>
        <span className="detail-label">Role</span>
        <strong>{user.role}</strong>
      </div>
      <div>
        <span className="detail-label">Email</span>
        <strong>{user.email}</strong>
      </div>
      <div>
        <span className="detail-label">NIRA ID</span>
        <strong>{user.niraId || '—'}</strong>
      </div>
      <div>
        <span className="detail-label">Phone</span>
        <strong>{user.phone || '—'}</strong>
      </div>
      <div>
        <span className="detail-label">Tell</span>
        <strong>{user.tell || '—'}</strong>
      </div>
      <div>
        <span className="detail-label">Badge Number</span>
        <strong>{user.badgeNumber || '—'}</strong>
      </div>
      <div>
        <span className="detail-label">Station</span>
        <strong>{user.station || '—'}</strong>
      </div>
      <div>
        <span className="detail-label">Status</span>
        <StatusBadge status={user.isActive ? 'Active' : 'Inactive'} />
      </div>
      <div>
        <span className="detail-label">Created</span>
        <strong>{formatDate(user.createdAt)}</strong>
      </div>
    </div>
  );
}
