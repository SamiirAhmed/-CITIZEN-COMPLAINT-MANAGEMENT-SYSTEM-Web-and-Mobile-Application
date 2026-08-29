import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';

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
      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>{citizen.name}</h2>
            <p className="muted">{citizen.email}</p>
          </div>
          <StatusBadge status={citizen.isActive ? 'Active' : 'Inactive'} />
        </div>

        <div className="detail-grid">
          <div>
            <span className="detail-label">NIRA ID</span>
            <strong>{citizen.niraId || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Phone</span>
            <strong>{citizen.phone || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Tell</span>
            <strong>{citizen.tell || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Registered</span>
            <strong>{formatDate(citizen.createdAt)}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Related Complaints</h3>
        </div>
        {complaints.length ? (
          <div className="table-wrap">
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

      <section className="panel">
        <div className="panel__header">
          <h3>Related OB Records</h3>
        </div>
        {obRecords.length ? (
          <div className="table-wrap">
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
          <EmptyState title="No OB records" description="No occurrence book records are linked to this citizen." />
        )}
      </section>
    </div>
  );
}
