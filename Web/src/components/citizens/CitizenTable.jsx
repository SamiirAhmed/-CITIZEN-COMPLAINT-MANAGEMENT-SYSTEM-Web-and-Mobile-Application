import StatusBadge from '../common/StatusBadge';
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
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>NIRA ID</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {citizens.map((citizen) => {
            const id = citizen.id;
            const busy = busyId === id;
            const active = isRecordActive(citizen);
            const statusActionLabel = active ? 'Deactivate' : 'Activate';
            return (
              <tr key={id}>
                <td className="cell-avatar">
                  <ProfileAvatar
                    name={citizen.name}
                    src={citizen.profileImage}
                    size={44}
                  />
                </td>
                <td className="cell-name">{citizen.name}</td>
                <td>{citizen.niraId || '—'}</td>
                <td>{citizen.phone || '—'}</td>
                <td className="cell-muted">{citizen.email}</td>
                <td>
                  <StatusBadge status={active ? 'Active' : 'Inactive'} />
                </td>
                <td className="cell-muted">{formatDate(citizen.createdAt)}</td>
                <td>
                  <div className="action-row">
                    <button
                      type="button"
                      className="btn btn--table"
                      onClick={() => onView(citizen)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn btn--table"
                      onClick={() => onEdit(citizen)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`btn btn--table ${active ? 'btn--table-danger' : 'btn--table-success'}`}
                      disabled={busy}
                      aria-label={`${statusActionLabel} ${citizen.name}`}
                      title={
                        active
                          ? 'Status is Active — click to deactivate'
                          : 'Status is Inactive — click to activate'
                      }
                      onClick={() => onToggleStatus(citizen)}
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
