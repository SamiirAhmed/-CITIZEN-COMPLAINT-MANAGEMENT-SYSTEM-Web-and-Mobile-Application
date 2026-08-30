import StatusBadge from '../common/StatusBadge';
import RoleBadge from '../common/RoleBadge';
import ProfileAvatar from '../common/ProfileAvatar';

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
    <div className="detail-stack">
      <section className="profile-hero">
        <ProfileAvatar name={user.name} src={user.profileImage} size={120} className="profile-avatar--ring profile-avatar--lg" />
        <div>
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
          <div className="profile-hero__badges">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.isActive !== false ? 'Active' : 'Inactive'} />
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Personal Information</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Name</span>
            <strong>{user.name}</strong>
          </div>
          <div>
            <span className="detail-label">NIRA ID</span>
            <strong>{user.niraId || '—'}</strong>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Contact Information</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Email</span>
            <strong>{user.email}</strong>
          </div>
          <div>
            <span className="detail-label">Phone</span>
            <strong>{user.phone || '—'}</strong>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Professional Information</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Badge Number</span>
            <strong>{user.badgeNumber || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Station</span>
            <strong>{user.station || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">District</span>
            <strong>{user.district || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Region</span>
            <strong>{user.region || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Role</span>
            <strong>{user.role}</strong>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Account Information</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Status</span>
            <StatusBadge status={user.isActive !== false ? 'Active' : 'Inactive'} />
          </div>
          <div>
            <span className="detail-label">Created</span>
            <strong>{formatDate(user.createdAt)}</strong>
          </div>
          <div>
            <span className="detail-label">Updated</span>
            <strong>{formatDate(user.updatedAt)}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
