import StatusBadge from '../common/StatusBadge';
import { formatDateTime } from '../../constants/domain';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export default function ComplaintDetails({ complaint, linkedOB = null }) {
  if (!complaint) return null;

  const history = Array.isArray(complaint.statusHistory) ? complaint.statusHistory : [];

  return (
    <div className="detail-stack">
      <section className="detail-section">
        <h3>Complaint Summary</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Complaint Number</span>
            <strong>{complaint.complaintNumber || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Status</span>
            <StatusBadge status={complaint.status} />
          </div>
          <div>
            <span className="detail-label">Category</span>
            <strong>{complaint.category || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Incident Date</span>
            <strong>{formatDateTime(complaint.incidentDate)}</strong>
          </div>
          <div>
            <span className="detail-label">Location</span>
            <strong>{complaint.location || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">District</span>
            <strong>{complaint.district || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Village</span>
            <strong>{complaint.village || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Area</span>
            <strong>{complaint.area || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Submitted</span>
            <strong>{formatDateTime(complaint.createdAt)}</strong>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Citizen</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Name</span>
            <strong>{complaint.citizen?.name || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">NIRA ID</span>
            <strong>{complaint.citizen?.niraId || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Phone</span>
            <strong>{complaint.citizen?.phone || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Email</span>
            <strong>{complaint.citizen?.email || '—'}</strong>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3>Description</h3>
        <p>{complaint.description || '—'}</p>
      </section>

      <section className="detail-section">
        <h3>Evidence Notes</h3>
        <p>{complaint.evidenceNotes || '—'}</p>
      </section>

      {Array.isArray(complaint.evidence) && complaint.evidence.length ? (
        <section className="detail-section">
          <h3>Evidence Files</h3>
          <ul className="evidence-list">
            {complaint.evidence.map((item) => {
              const isImage = String(item.mimeType || '').startsWith('image/');
              const isVideo = String(item.mimeType || '').startsWith('video/');
              const href = item.url ? resolveMediaUrl(item.url) : '';
              return (
                <li key={item.id || item.url} className="evidence-list__item">
                  <div>
                    <strong>{item.originalName || item.fileName || 'Evidence'}</strong>
                    {item.note ? <p>{item.note}</p> : null}
                    {isImage && href ? (
                      <img
                        className="evidence-list__media"
                        src={href}
                        alt={item.originalName || 'Evidence'}
                      />
                    ) : null}
                    {isVideo && href ? (
                      <video className="evidence-list__media" src={href} controls />
                    ) : null}
                    {!isImage && !isVideo && href ? (
                      <a href={href} target="_blank" rel="noreferrer">
                        Open file
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {complaint.rejectionReason ? (
        <section className="detail-section">
          <h3>Rejection Reason</h3>
          <p>{complaint.rejectionReason}</p>
        </section>
      ) : null}

      {linkedOB ? (
        <section className="detail-section">
          <h3>Linked OB</h3>
          <div className="detail-grid">
            <div>
              <span className="detail-label">OB Number</span>
              <strong>{linkedOB.obNumber}</strong>
            </div>
            <div>
              <span className="detail-label">Status</span>
              <StatusBadge status={linkedOB.status} />
            </div>
          </div>
        </section>
      ) : null}

      {history.length ? (
        <section className="detail-section">
          <h3>Status History</h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Note</th>
                  <th>Changed</th>
                </tr>
              </thead>
              <tbody>
                {[...history]
                  .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                  .map((item, index) => (
                    <tr key={`${item.status}-${index}`}>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="cell-muted">{item.note || '—'}</td>
                      <td className="cell-muted">{formatDateTime(item.changedAt)}</td>
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
