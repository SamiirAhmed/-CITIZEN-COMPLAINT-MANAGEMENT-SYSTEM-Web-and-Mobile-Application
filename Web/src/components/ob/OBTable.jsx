import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import { formatDate, getRecordId } from '../../constants/domain';

export default function OBTable({
  records = [],
  busyId = null,
  onView,
  onAssign,
  onUpdateStatus,
  onDelete,
  canAssign = true,
  canDelete = true,
  canUpdateStatus = true,
}) {
  if (!records.length) {
    return (
      <EmptyState
        title="No OB records found"
        description="Create an OB from a verified complaint or adjust your filters."
      />
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>OB Number</th>
            <th>Complaint</th>
            <th>Citizen</th>
            <th>Assigned Officer</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const id = getRecordId(record);
            const busy = busyId === id;
            return (
              <tr key={id}>
                <td className="cell-name">{record.obNumber || '—'}</td>
                <td>{record.complaint?.complaintNumber || '—'}</td>
                <td>{record.citizen?.name || '—'}</td>
                <td>{record.assignedOfficer?.name || 'Unassigned'}</td>
                <td>
                  <StatusBadge status={record.status} />
                </td>
                <td className="cell-muted">{formatDate(record.updatedAt)}</td>
                <td>
                  <div className="action-row">
                    <button type="button" className="btn btn--table" onClick={() => onView(record)}>
                      View
                    </button>
                    {canAssign ? (
                      <button
                        type="button"
                        className="btn btn--table"
                        disabled={busy}
                        onClick={() => onAssign(record)}
                      >
                        Assign
                      </button>
                    ) : null}
                    {canUpdateStatus ? (
                      <button
                        type="button"
                        className="btn btn--table"
                        disabled={busy}
                        onClick={() => onUpdateStatus(record)}
                      >
                        Status
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        className="btn btn--table btn--table-danger"
                        disabled={busy}
                        onClick={() => onDelete(record)}
                      >
                        {busy ? 'Deleting…' : 'Delete'}
                      </button>
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
