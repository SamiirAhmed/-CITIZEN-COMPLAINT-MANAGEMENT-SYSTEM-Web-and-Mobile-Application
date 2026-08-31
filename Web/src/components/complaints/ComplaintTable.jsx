import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import { formatDate, getRecordId } from '../../constants/domain';

function isRecordActive(record) {
  return record?.isActive !== false && record?.isActive !== 'false' && record?.isActive !== 0;
}

export default function ComplaintTable({
  complaints = [],
  busyId = null,
  onView,
  onEdit,
  onToggleActive,
  onCreateOB,
}) {
  if (!complaints.length) {
    return (
      <EmptyState
        title="No complaints found"
        description="Create a complaint or adjust your search and filters."
      />
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Number</th>
            <th>Citizen</th>
            <th>Category</th>
            <th>Location</th>
            <th>Status</th>
            <th>Active</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((complaint) => {
            const id = getRecordId(complaint);
            const busy = busyId === id;
            const active = isRecordActive(complaint);
            const statusActionLabel = active ? 'Deactivate' : 'Activate';
            const canCreateOB =
              active &&
              ['Submitted', 'Under Review', 'Verified'].includes(complaint.status);
            return (
              <tr key={id}>
                <td className="cell-name">{complaint.complaintNumber || '—'}</td>
                <td>{complaint.citizen?.name || '—'}</td>
                <td>{complaint.category || '—'}</td>
                <td className="cell-muted">{complaint.location || '—'}</td>
                <td>
                  <StatusBadge status={complaint.status} />
                </td>
                <td>
                  <StatusBadge status={active ? 'Active' : 'Inactive'} />
                </td>
                <td className="cell-muted">{formatDate(complaint.createdAt)}</td>
                <td>
                  <div className="action-row">
                    <button type="button" className="btn btn--table" onClick={() => onView(complaint)}>
                      View
                    </button>
                    <button type="button" className="btn btn--table" onClick={() => onEdit(complaint)}>
                      Edit
                    </button>
                    {canCreateOB ? (
                      <button
                        type="button"
                        className="btn btn--table"
                        disabled={busy}
                        onClick={() => onCreateOB(complaint)}
                      >
                        Create OB
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={`btn btn--table ${active ? 'btn--table-danger' : 'btn--table-success'}`}
                      disabled={busy}
                      onClick={() => onToggleActive(complaint)}
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
