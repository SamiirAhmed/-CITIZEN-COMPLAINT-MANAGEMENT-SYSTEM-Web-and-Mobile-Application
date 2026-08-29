import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
}

export default function CitizenTable({
  citizens = [],
  onView,
  onEdit,
  onToggleStatus,
  busyId = null,
}) {
  if (!citizens.length) {
    return (
      <EmptyState
        title="No citizens found"
        description="Try adjusting your search or status filter."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>NIRA ID</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {citizens.map((citizen) => {
            const id = citizen.id;
            const busy = busyId === id;
            return (
              <tr key={id}>
                <td>
                  <strong>{citizen.name}</strong>
                </td>
                <td>{citizen.niraId || '—'}</td>
                <td>{citizen.email}</td>
                <td>{citizen.phone || '—'}</td>
                <td>
                  <StatusBadge status={citizen.isActive ? 'Active' : 'Inactive'} />
                </td>
                <td>{formatDate(citizen.createdAt)}</td>
                <td>
                  <div className="action-row">
                    <button type="button" className="btn btn--small btn--ghost" onClick={() => onView(citizen)}>
                      View
                    </button>
                    <button type="button" className="btn btn--small btn--secondary" onClick={() => onEdit(citizen)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`btn btn--small ${citizen.isActive ? 'btn--danger' : 'btn--success'}`}
                      disabled={busy}
                      onClick={() => onToggleStatus(citizen)}
                    >
                      {busy ? 'Updating…' : citizen.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
