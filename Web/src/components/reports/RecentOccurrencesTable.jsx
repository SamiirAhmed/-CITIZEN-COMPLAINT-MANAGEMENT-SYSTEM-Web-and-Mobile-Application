import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

function formatDateTime(record) {
  const date = record.occurrenceDate
    ? new Date(record.occurrenceDate).toLocaleDateString()
    : '—';
  const time = record.occurrenceTime || '—';
  return `${date} · ${time}`;
}

export default function RecentOccurrencesTable({ records, loading, onView, onEdit }) {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);

  if (loading) {
    return (
      <div className="report-table-wrap">
        <div className="report-table-skeleton">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton skeleton--row" />
          ))}
        </div>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="report-table-empty">
        <h3>No recent OB records</h3>
        <p>No OB record data available for this period.</p>
      </div>
    );
  }

  return (
    <div className="report-table-wrap">
      <table className="report-table">
        <thead>
          <tr>
            <th>OB Number</th>
            <th>Date &amp; Time</th>
            <th>Citizen</th>
            <th>Category</th>
            <th>Location</th>
            <th>Assigned Officer</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>
                <strong>{record.obNumber}</strong>
              </td>
              <td>{formatDateTime(record)}</td>
              <td>{record.complainantName || record.citizen?.name || '—'}</td>
              <td>{record.category || record.occurrenceType || '—'}</td>
              <td className="cell-clamp">{record.location || '—'}</td>
              <td>{record.assignedOfficer?.name || 'Unassigned'}</td>
              <td>
                <StatusBadge status={record.status} />
              </td>
              <td>
                <div className="report-table__actions">
                  <button
                    type="button"
                    className="btn btn--small btn--ghost"
                    onClick={() => (onView ? onView(record) : navigate('/ob-records', { state: { viewId: record.id } }))}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="btn btn--small btn--secondary"
                    onClick={() => (onEdit ? onEdit(record) : navigate('/ob-records', { state: { editId: record.id } }))}
                  >
                    Edit
                  </button>
                  <div className="report-table__menu">
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      aria-label="More actions"
                      onClick={() =>
                        setOpenMenuId((current) => (current === record.id ? null : record.id))
                      }
                    >
                      ⋯
                    </button>
                    {openMenuId === record.id ? (
                      <div className="report-table__dropdown">
                        <button
                          type="button"
                          onClick={() => {
                            navigate('/ob-records', { state: { viewId: record.id } });
                            setOpenMenuId(null);
                          }}
                        >
                          Open in OB Records
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigate('/ob-records');
                            setOpenMenuId(null);
                          }}
                        >
                          View all records
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
