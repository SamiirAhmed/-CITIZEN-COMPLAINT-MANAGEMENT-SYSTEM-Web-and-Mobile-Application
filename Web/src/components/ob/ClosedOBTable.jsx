import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import { formatDate, formatDateTime, getRecordId } from '../../constants/domain';

function closedByLabel(record) {
  const updates = Array.isArray(record.updates) ? record.updates : [];
  const closedUpdate = [...updates]
    .reverse()
    .find((item) => /closed/i.test(String(item.title || '')));
  if (closedUpdate?.createdBy?.name) return closedUpdate.createdBy.name;
  if (record.closedBy?.name) return record.closedBy.name;
  return '—';
}

export default function ClosedOBTable({
  records = [],
  busyId = null,
  onView,
  onReopen,
}) {
  if (!records.length) {
    return (
      <EmptyState
        title="No Closed OBE Cases"
        description="There are currently no closed cases available to reopen."
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
            <th>Assigned Police</th>
            <th>Status</th>
            <th>Closed Date</th>
            <th>Closed By</th>
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
                <td className="cell-muted">
                  {formatDate(record.closedAt) !== '—'
                    ? formatDateTime(record.closedAt)
                    : '—'}
                </td>
                <td className="cell-muted">{closedByLabel(record)}</td>
                <td>
                  <div className="action-row">
                    <button
                      type="button"
                      className="btn btn--table"
                      onClick={() => onView(record)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn btn--table"
                      disabled={busy}
                      onClick={() => onReopen(record)}
                    >
                      {busy ? 'Reopening…' : 'Re-open OBE'}
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
