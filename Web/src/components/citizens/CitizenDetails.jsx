import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import ProfileAvatar from '../common/ProfileAvatar';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

export default function CitizenDetails({ citizen, complaints = [], obRecords = [] }) {
  if (!citizen) return null;

  return (
    <div className="detail-stack">
      <section className="profile-hero">
        <ProfileAvatar
          name={citizen.name}
          src={citizen.profileImage}
          size={120}
          className="profile-avatar--ring profile-avatar--lg"
        />
        <div>
          <h2>{citizen.name}</h2>
          <p className="muted">{citizen.email}</p>
          <div className="profile-hero__badges">
            <StatusBadge status={citizen.isActive !== false ? 'Active' : 'Inactive'} />
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Personal Information</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Name</span>
            <strong>{citizen.name}</strong>
          </div>
          <div>
            <span className="detail-label">NIRA ID</span>
            <strong>{citizen.niraId || '—'}</strong>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Contact Information</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Phone</span>
            <strong>{citizen.phone || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Email</span>
            <strong>{citizen.email || '—'}</strong>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Account Information</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Status</span>
            <StatusBadge status={citizen.isActive !== false ? 'Active' : 'Inactive'} />
          </div>
          <div>
            <span className="detail-label">Registration Date</span>
            <strong>{formatDate(citizen.createdAt)}</strong>
          </div>
          <div>
            <span className="detail-label">Updated</span>
            <strong>{formatDate(citizen.updatedAt)}</strong>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Related Complaints</h3>
        {complaints.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((item) => (
                  <tr key={item.id || item._id}>
                    <td>{item.complaintNumber || '—'}</td>
                    <td>{item.category || '—'}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No complaints" description="This citizen has not submitted any complaints." />
        )}
      </section>

      <section className="detail-section">
        <h3>Related OB Records</h3>
        {obRecords.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>OB Number</th>
                  <th>Complaint</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {obRecords.map((item) => (
                  <tr key={item.id || item._id}>
                    <td>{item.obNumber || '—'}</td>
                    <td>{item.complaint?.complaintNumber || item.complaintNumber || '—'}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No OB records"
            description="No OB records are linked to this citizen."
          />
        )}
      </section>
    </div>
  );
}
