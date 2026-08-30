import StatusBadge from '../common/StatusBadge';
import { formatDateTime } from '../../constants/domain';

export default function OBDetails({ record }) {
  if (!record) return null;

  const updates = Array.isArray(record.updates) ? record.updates : [];

  return (
    <div className="detail-stack">
      <section className="detail-section">
        <h3>OB Summary</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">OB Number</span>
            <strong>{record.obNumber || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Status</span>
            <StatusBadge status={record.status} />
          </div>
          <div>
            <span className="detail-label">Created</span>
            <strong>{formatDateTime(record.createdAt)}</strong>
          </div>
          <div>
            <span className="detail-label">Updated</span>
            <strong>{formatDateTime(record.updatedAt)}</strong>
          </div>
          <div>
            <span className="detail-label">Assigned At</span>
            <strong>{formatDateTime(record.assignedAt)}</strong>
          </div>
          <div>
            <span className="detail-label">Closed At</span>
            <strong>{formatDateTime(record.closedAt)}</strong>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Citizen / Complaint</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Citizen</span>
            <strong>{record.citizen?.name || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Complaint</span>
            <strong>{record.complaint?.complaintNumber || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Category</span>
            <strong>{record.complaint?.category || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Location</span>
            <strong>{record.complaint?.location || '—'}</strong>
          </div>
        </div>
        {record.complaint?.description ? <p>{record.complaint.description}</p> : null}
      </section>

      <section className="detail-section">
        <h3>Assignment</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Assigned Officer</span>
            <strong>{record.assignedOfficer?.name || 'Unassigned'}</strong>
          </div>
          <div>
            <span className="detail-label">Badge</span>
            <strong>{record.assignedOfficer?.badgeNumber || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Station</span>
            <strong>{record.assignedOfficer?.station || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Created By</span>
            <strong>{record.createdBy?.name || '—'}</strong>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Notes</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Citizen Summary</span>
            <strong>{record.citizenSummary || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Closure Reason</span>
            <strong>{record.closureReason || '—'}</strong>
          </div>
        </div>
        {record.investigationNotes ? (
          <>
            <span className="detail-label">Investigation Notes</span>
            <p>{record.investigationNotes}</p>
          </>
        ) : null}
      </section>

      {updates.length ? (
        <section className="detail-section">
          <h3>Updates</h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Note</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {[...updates]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((item, index) => (
                    <tr key={`${item.title}-${index}`}>
                      <td>{item.title}</td>
                      <td className="cell-muted">{item.note || '—'}</td>
                      <td className="cell-muted">{formatDateTime(item.createdAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
