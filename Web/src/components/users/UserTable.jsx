import StatusBadge from '../common/StatusBadge';
import RoleBadge from '../common/RoleBadge';
import EmptyState from '../common/EmptyState';
import ProfileAvatar from '../common/ProfileAvatar';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
}

function isRecordActive(record) {
  return record?.isActive !== false && record?.isActive !== 'false' && record?.isActive !== 0;
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
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Phone</th>
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
            const active = isRecordActive(user);
            const statusActionLabel = active ? 'Deactivate' : 'Activate';
            return (
              <tr key={id}>
                <td className="cell-avatar">
                  <ProfileAvatar name={user.name} src={user.profileImage} size={44} />
                </td>
                <td className="cell-name">{user.name}</td>
                <td>
                  <RoleBadge role={user.role} />
                </td>
                <td className="cell-muted">{user.email}</td>
                <td>{user.phone || '—'}</td>
                <td>{user.badgeNumber || '—'}</td>
                <td>{user.station || '—'}</td>
                <td>
                  <StatusBadge status={active ? 'Active' : 'Inactive'} />
                </td>
                <td className="cell-muted">{formatDate(user.createdAt)}</td>
                <td>
                  <div className="action-row">
                    <button
                      type="button"
                      className="btn btn--table"
                      onClick={() => onView(user)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn btn--table"
                      onClick={() => onEdit(user)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`btn btn--table ${active ? 'btn--table-danger' : 'btn--table-success'}`}
                      disabled={busy || isSelf}
                      aria-label={`${statusActionLabel} ${user.name}`}
                      title={
                        isSelf
                          ? 'You cannot change your own account status.'
                          : active
                            ? 'Status is Active — click to deactivate'
                            : 'Status is Inactive — click to activate'
                      }
                      onClick={() => onToggleStatus(user)}
                    >
                      {busy ? 'Updating…' : statusActionLabel}
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
