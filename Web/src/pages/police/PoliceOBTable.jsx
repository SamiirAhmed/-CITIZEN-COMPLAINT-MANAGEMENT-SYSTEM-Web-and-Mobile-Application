import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from './policeFormat';

export default function PoliceOBTable({
  records = [],
  emptyTitle = 'No OB records found',
  emptyMessage = 'Assigned OB records will appear here.',
  actionLabel = 'View',
}) {
  const navigate = useNavigate();

  if (!records.length) {
    return <EmptyState title={emptyTitle} description={emptyMessage} />;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>OB Number</th>
            <th>Complaint</th>
            <th>Citizen</th>
            <th>Status</th>
            <th>Assigned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td className="cell-name">{record.obNumber || '—'}</td>
              <td>
                <div>{record.complaint?.complaintNumber || '—'}</div>
                <div className="cell-muted">{record.complaint?.category || ''}</div>
              </td>
              <td>{record.citizen?.name || '—'}</td>
              <td>
                <StatusBadge status={record.status} />
              </td>
              <td className="cell-muted">{formatDate(record.assignedAt)}</td>
              <td>
                <div className="action-row">
                  <button
                    type="button"
                    className="btn btn--table"
                    onClick={() => navigate(`/ob-records/${record.id}`)}
                  >
                    {actionLabel}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
