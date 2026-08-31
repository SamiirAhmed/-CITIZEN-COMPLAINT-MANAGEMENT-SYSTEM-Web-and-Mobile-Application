import StatusBadge from '../common/StatusBadge';
import EvidenceList from '../common/EvidenceList';
import { formatDateTime } from '../../constants/domain';

function findLatestUpdate(updates = [], matcher) {
  return [...updates]
    .reverse()
    .find((item) => matcher(String(item.title || ''), item));
}

function buildAssignmentHistory(record) {
  const history = Array.isArray(record.assignmentHistory)
    ? [...record.assignmentHistory]
    : [];

  if (!history.length && (record.assignedOfficer?.name || record.assignedOfficer?.id)) {
    history.push({
      officerId: record.assignedOfficer.id || '',
      officerName: record.assignedOfficer.name || 'Assigned officer',
      badgeNumber: record.assignedOfficer.badgeNumber || '',
      station: record.assignedOfficer.station || '',
      assignedAt: record.assignedAt,
      note: 'Current assignment',
    });
  }

  return history.sort(
    (a, b) => new Date(a.assignedAt || 0) - new Date(b.assignedAt || 0)
  );
}

export default function OBDetails({ record }) {
  if (!record) return null;

  const notes = Array.isArray(record.investigationNoteEntries)
    ? record.investigationNoteEntries
    : [];
  const updates = Array.isArray(record.updates) ? record.updates : [];
  const assignmentHistory = buildAssignmentHistory(record);

  const closedUpdate = findLatestUpdate(updates, (title) => /closed/i.test(title));
  const reopenUpdate = findLatestUpdate(updates, (title) => /re-?open/i.test(title));

  return (
    <div className="detail-stack ob-print">
      <div className="print-only print-ob-header">
        <h1>OB Record</h1>
        <p>{record.obNumber || 'Occurrence Book'}</p>
        <p className="print-ob-header__meta">Printed {new Date().toLocaleString()}</p>
      </div>
      <section className="detail-section">
        <h3>OB Summary</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">OB Number</span>
            <strong>{record.obNumber || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Current Status</span>
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
        <h3>Current Assignment</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Current Assigned Officer</span>
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

      {assignmentHistory.length ? (
        <section className="detail-section">
          <h3>Assignment History</h3>
          <ul className="timeline-list">
            {assignmentHistory.map((item, index) => (
              <li key={item.id || `${item.officerId || item.officerName}-${index}`}>
                <strong>{item.officerName || 'Officer'}</strong>
                <p>
                  {[
                    item.badgeNumber ? `Badge ${item.badgeNumber}` : null,
                    item.station || null,
                    'Role: Police',
                    item.note || null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <em>
                  Assigned: {formatDateTime(item.assignedAt)}
                  {item.assignedBy?.name ? ` · by ${item.assignedBy.name}` : ''}
                </em>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="detail-section">
        <h3>Investigation</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Started</span>
            <strong>{formatDateTime(record.investigationStartedAt)}</strong>
          </div>
          <div>
            <span className="detail-label">Completed</span>
            <strong>{formatDateTime(record.investigationCompletedAt)}</strong>
          </div>
          <div>
            <span className="detail-label">Progress</span>
            <strong>{Number(record.investigationProgress || 0)}%</strong>
          </div>
          <div>
            <span className="detail-label">Citizen Summary</span>
            <strong>{record.citizenSummary || '—'}</strong>
          </div>
        </div>
        {record.investigationNotes ? (
          <>
            <span className="detail-label">Investigation Notes</span>
            <p>{record.investigationNotes}</p>
          </>
        ) : null}
        {notes.length ? (
          <ul className="timeline-list" style={{ marginTop: 12 }}>
            {notes.map((item, index) => (
              <li key={item.id || index}>
                <strong>{formatDateTime(item.createdAt)}</strong>
                <p>{item.note}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="detail-section">
        <h3>Closure / Re-open</h3>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Closure Reason</span>
            <strong>{record.closureReason || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Closed Date</span>
            <strong>{formatDateTime(record.closedAt)}</strong>
          </div>
          <div>
            <span className="detail-label">Closed By</span>
            <strong>{closedUpdate?.createdBy?.name || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Re-opened Date</span>
            <strong>
              {reopenUpdate ? formatDateTime(reopenUpdate.createdAt) : '—'}
            </strong>
          </div>
          <div>
            <span className="detail-label">Re-opened By</span>
            <strong>{reopenUpdate?.createdBy?.name || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Current Status</span>
            <StatusBadge status={record.status} />
          </div>
        </div>
      </section>

      {updates.length ? (
        <section className="detail-section">
          <h3>Status History</h3>
          <ul className="timeline-list">
            {[...updates]
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((item, index) => (
                <li key={`${item.title}-${index}`}>
                  <strong>{item.title}</strong>
                  <p>{item.note || '—'}</p>
                  <em>
                    {formatDateTime(item.createdAt)}
                    {item.createdBy?.name ? ` · ${item.createdBy.name}` : ''}
                  </em>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <section className="detail-section">
        <EvidenceList
          items={record.evidence || []}
          emptyMessage="No evidence has been uploaded for this case."
        />
      </section>
    </div>
  );
}
