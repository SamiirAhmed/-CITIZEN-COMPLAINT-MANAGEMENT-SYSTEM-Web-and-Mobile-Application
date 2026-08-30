import StatusBadge from '../common/StatusBadge';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
}

const PRIORITY_CLASS = {
  LOW: 'priority-badge priority-badge--low',
  MEDIUM: 'priority-badge priority-badge--medium',
  HIGH: 'priority-badge priority-badge--high',
  CRITICAL: 'priority-badge priority-badge--critical',
};

export default function OccurrenceTable({
  records,
  isAdmin,
  busyId,
  onView,
  onEdit,
  onAssign,
  onChangeStatus,
  onClose,
  onReopen,
}) {
  if (!records.length) {
    return (
      <div className="state-panel state-panel--empty">
        <h3>No occurrences found</h3>
        <p>Create a new occurrence or adjust your search filters.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table data-table--ob">
        <thead>
          <tr>
            <th>OB Number</th>
            <th>Date</th>
            <th>Time</th>
            <th>Category</th>
            <th>Subject</th>
            <th>Location</th>
            <th>Assigned Officer</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const closed = ['Closed', 'Resolved'].includes(record.status);
            const busy = busyId === record.id;
            return (
              <tr key={record.id}>
                <td>
                  <strong>{record.obNumber}</strong>
                </td>
                <td>{formatDate(record.occurrenceDate)}</td>
                <td>{record.occurrenceTime || '—'}</td>
                <td>{record.category || '—'}</td>
                <td className="cell-clamp">{record.subject || '—'}</td>
                <td className="cell-clamp">{record.location || '—'}</td>
                <td>{record.assignedOfficer?.name || 'Unassigned'}</td>
                <td>
                  <span className={PRIORITY_CLASS[record.priority] || PRIORITY_CLASS.MEDIUM}>
                    {record.priority || 'MEDIUM'}
                  </span>
                </td>
                <td>
                  <StatusBadge status={record.status} />
                </td>
                <td>
                  <div className="action-row">
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      onClick={() => onView(record)}
                      disabled={busy}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn btn--small btn--secondary"
                      onClick={() => onEdit(record)}
                      disabled={busy}
                    >
                      Edit
                    </button>
                    {isAdmin ? (
                      <button
                        type="button"
                        className="btn btn--small btn--ghost"
                        onClick={() => onAssign(record)}
                        disabled={busy}
                      >
                        Assign
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      onClick={() => onChangeStatus(record)}
                      disabled={busy}
                    >
                      Status
                    </button>
                    {isAdmin && !closed ? (
                      <button
                        type="button"
                        className="btn btn--small btn--danger"
                        onClick={() => onClose(record)}
                        disabled={busy}
                      >
                        Close
                      </button>
                    ) : null}
                    {isAdmin && closed ? (
                      <button
                        type="button"
                        className="btn btn--small btn--success"
                        onClick={() => onReopen(record)}
                        disabled={busy}
                      >
                        Reopen
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
