import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import {
  canAssignOB,
  canDeleteOB,
  canUpdateOBWorkflow,
  formatDate,
  getRecordId,
} from '../../constants/domain';

function isRecordActive(record) {
  return record?.isActive !== false && record?.isActive !== 'false' && record?.isActive !== 0;
}

export default function OBTable({
  records = [],
  busyId = null,
  onView,
  onAssign,
  onUpdateStatus,
  onToggleActive,
  canAssign = true,
  canToggleActive = true,
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
            <th>Active</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const id = getRecordId(record);
            const busy = busyId === id;
            const active = isRecordActive(record);
            const statusActionLabel = active ? 'Deactivate' : 'Activate';
            const showAssign = canAssign && active && canAssignOB(record);
            const showStatus = canUpdateStatus && active && canUpdateOBWorkflow(record);
            const showToggle = canToggleActive && canDeleteOB(record);
            return (
              <tr key={id}>
                <td className="cell-name">{record.obNumber || '—'}</td>
                <td>{record.complaint?.complaintNumber || '—'}</td>
                <td>{record.citizen?.name || '—'}</td>
                <td>{record.assignedOfficer?.name || 'Unassigned'}</td>
                <td>
                  <StatusBadge status={record.status} />
                </td>
                <td>
                  <StatusBadge status={active ? 'Active' : 'Inactive'} />
                </td>
                <td className="cell-muted">{formatDate(record.updatedAt)}</td>
                <td>
                  <div className="action-row">
                    <button type="button" className="btn btn--table" onClick={() => onView(record)}>
                      View
                    </button>
                    {showAssign ? (
                      <button
                        type="button"
                        className="btn btn--table"
                        disabled={busy}
                        onClick={() => onAssign(record)}
                      >
                        Assign
                      </button>
                    ) : null}
                    {showStatus ? (
                      <button
                        type="button"
                        className="btn btn--table"
                        disabled={busy}
                        onClick={() => onUpdateStatus(record)}
                      >
                        Update Status
                      </button>
                    ) : null}
                    {showToggle ? (
                      <button
                        type="button"
                        className={`btn btn--table ${active ? 'btn--table-danger' : 'btn--table-success'}`}
                        disabled={busy}
                        onClick={() => onToggleActive(record)}
                      >
                        {busy ? 'Updating…' : statusActionLabel}
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
