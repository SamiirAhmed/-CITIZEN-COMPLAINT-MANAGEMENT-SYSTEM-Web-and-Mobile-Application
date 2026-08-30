import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from './policeFormat';

function truncate(value, length = 72) {
  const text = String(value || '').trim();
  if (!text) return '—';
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}

function SortableTh({ label, column, sortKey, sortDir, onSort }) {
  if (!onSort) {
    return <th>{label}</th>;
  }

  const active = sortKey === column;
  return (
    <th>
      <button
        type="button"
        className={`th-sort ${active ? 'is-active' : ''}`}
        onClick={() => onSort(column)}
      >
        {label}
        {active ? <span aria-hidden="true">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span> : null}
      </button>
    </th>
  );
}

export default function PoliceOBTable({
  records = [],
  emptyTitle = 'No OB records found',
  emptyMessage = 'Assigned occurrence book records will appear here.',
  busyId = null,
  variant = 'ob',
  showActions = true,
  sortKey = '',
  sortDir = 'asc',
  onSort,
  onView,
  onEdit,
  onDelete,
}) {
  const isInvestigation = variant === 'investigation';

  if (!records.length) {
    return <EmptyState title={emptyTitle} description={emptyMessage} />;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <SortableTh label="ID" column="id" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            {isInvestigation ? (
              <SortableTh
                label="Case"
                column="case"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
            ) : (
              <SortableTh
                label="Date"
                column="date"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
            )}
            {isInvestigation ? (
              <SortableTh
                label="Description"
                column="description"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
            ) : (
              <SortableTh
                label="Type"
                column="type"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
            )}
            {isInvestigation ? null : (
              <SortableTh
                label="Description"
                column="description"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
            )}
            <SortableTh
              label="Officer"
              column="officer"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
            />
            <SortableTh
              label="Status"
              column="status"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
            />
            {isInvestigation ? (
              <SortableTh
                label="Date"
                column="invDate"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
            ) : null}
            {showActions ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const busy = busyId === record.id;
            const description = truncate(
              record.citizenSummary || record.complaint?.description
            );
            return (
              <tr key={record.id}>
                <td className="cell-name">{record.obNumber || '—'}</td>
                {isInvestigation ? (
                  <td>{record.complaint?.complaintNumber || '—'}</td>
                ) : (
                  <td className="cell-muted">
                    {formatDate(record.createdAt || record.assignedAt)}
                  </td>
                )}
                {isInvestigation ? (
                  <td>{description}</td>
                ) : (
                  <td>{record.complaint?.category || '—'}</td>
                )}
                {isInvestigation ? null : <td>{description}</td>}
                <td>{record.assignedOfficer?.name || 'You'}</td>
                <td>
                  <StatusBadge status={record.status} />
                </td>
                {isInvestigation ? (
                  <td className="cell-muted">
                    {formatDate(
                      record.investigationStartedAt || record.updatedAt || record.createdAt
                    )}
                  </td>
                ) : null}
                {showActions ? (
                  <td>
                    <div className="action-row">
                      <button type="button" className="btn btn--table" onClick={() => onView?.(record)}>
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn--table"
                        disabled={busy}
                        onClick={() => onEdit?.(record)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--table btn--table-danger"
                        disabled={busy}
                        onClick={() => onDelete?.(record)}
                      >
                        {busy ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
