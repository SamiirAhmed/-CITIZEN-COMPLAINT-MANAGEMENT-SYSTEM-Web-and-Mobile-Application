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

export default function UserTable({
  users = [],
  onView,
  onEdit,
  onToggleStatus,
  busyId = null,
  currentUserId = null,
}) {
  if (!users.length) {
    return (
      <EmptyState
        title="No staff users found"
        description="Register police officers or adjust your filters to see results."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Badge</th>
            <th>Station</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const id = user.id;
            const busy = busyId === id;
            const isSelf = currentUserId && currentUserId === id;
            return (
              <tr key={id}>
                <td>
                  <strong>{user.name}</strong>
                </td>
                <td>
                  <span className="type-chip">{user.role}</span>
                </td>
                <td>{user.email}</td>
                <td>{user.badgeNumber || '—'}</td>
                <td>{user.station || '—'}</td>
                <td>
                  <StatusBadge status={user.isActive ? 'Active' : 'Inactive'} />
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <div className="action-row">
                    <button type="button" className="btn btn--small btn--ghost" onClick={() => onView(user)}>
                      View
                    </button>
                    <button type="button" className="btn btn--small btn--secondary" onClick={() => onEdit(user)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`btn btn--small ${user.isActive ? 'btn--danger' : 'btn--success'}`}
                      disabled={busy || isSelf}
                      title={isSelf ? 'You cannot change your own account status.' : undefined}
                      onClick={() => onToggleStatus(user)}
                    >
                      {busy ? 'Updating…' : user.isActive ? 'Deactivate' : 'Activate'}
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
