import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import { formatDate, getRecordId } from '../../constants/domain';

export default function ComplaintTable({
  complaints = [],
  busyId = null,
  onView,
  onEdit,
  onDelete,
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
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((complaint) => {
            const id = getRecordId(complaint);
            const busy = busyId === id;
            const canCreateOB = ['Submitted', 'Under Review', 'Verified'].includes(
              complaint.status
            );
            return (
              <tr key={id}>
                <td className="cell-name">{complaint.complaintNumber || '—'}</td>
                <td>{complaint.citizen?.name || '—'}</td>
                <td>{complaint.category || '—'}</td>
                <td className="cell-muted">{complaint.location || '—'}</td>
                <td>
                  <StatusBadge status={complaint.status} />
                </td>
                <td className="cell-muted">{formatDate(complaint.createdAt)}</td>
                <td>
                  <div className="action-row">
                    <button type="button" className="btn btn--table" onClick={() => onView(complaint)}>
                      View
                    </button>
                    {complaint.status !== 'Closed' ? (
                      <>
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
                          className="btn btn--table btn--table-danger"
                          disabled={busy}
                          onClick={() => onDelete(complaint)}
                        >
                          {busy ? 'Deleting…' : 'Delete'}
                        </button>
                      </>
                    ) : null}
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
