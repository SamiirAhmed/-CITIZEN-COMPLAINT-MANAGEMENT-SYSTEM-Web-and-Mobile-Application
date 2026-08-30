import StatusBadge from '../common/StatusBadge';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

function formatDateOnly(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="detail-label">{label}</p>
      <p>{value || '—'}</p>
    </div>
  );
}

const PRIORITY_CLASS = {
  LOW: 'priority-badge priority-badge--low',
  MEDIUM: 'priority-badge priority-badge--medium',
  HIGH: 'priority-badge priority-badge--high',
  CRITICAL: 'priority-badge priority-badge--critical',
};

export default function OccurrenceDetails({ record }) {
  if (!record) return null;

  return (
    <div className="detail-stack occurrence-print">
      <section className="panel panel--nested">
        <div className="panel__header panel__header--spread">
          <div>
            <h3>Basic Information</h3>
            <p className="muted">{record.obNumber}</p>
          </div>
          <div className="action-row">
            <StatusBadge status={record.status} />
            <span className={PRIORITY_CLASS[record.priority] || PRIORITY_CLASS.MEDIUM}>
              {record.priority}
            </span>
          </div>
        </div>
        <div className="detail-grid">
          <DetailItem label="OB Number" value={record.obNumber} />
          <DetailItem label="Date" value={formatDateOnly(record.occurrenceDate)} />
          <DetailItem label="Time" value={record.occurrenceTime} />
          <DetailItem label="Date reported" value={formatDate(record.dateReported)} />
          <DetailItem label="Station" value={record.station} />
          <DetailItem label="Status" value={record.status} />
          <DetailItem label="Priority" value={record.priority} />
        </div>
      </section>

      <section className="panel panel--nested">
        <div className="panel__header">
          <h3>Complainant Information</h3>
        </div>
        <div className="detail-grid">
          <DetailItem label="Name" value={record.complainantName} />
          <DetailItem label="Phone" value={record.complainantPhone} />
          <DetailItem label="Address" value={record.complainantAddress} />
        </div>
      </section>

      <section className="panel panel--nested">
        <div className="panel__header">
          <h3>Incident Information</h3>
        </div>
        <div className="detail-grid">
          <DetailItem label="Category" value={record.category} />
          <DetailItem label="Type" value={record.occurrenceType} />
          <DetailItem label="Subject" value={record.subject} />
          <DetailItem label="Location" value={record.location} />
          <DetailItem label="District" value={record.district} />
        </div>
        <div className="detail-block">
          <p className="detail-label">Description</p>
          <p>{record.description || '—'}</p>
        </div>
      </section>

      <section className="panel panel--nested">
        <div className="panel__header">
          <h3>Police Information</h3>
        </div>
        <div className="detail-grid">
          <DetailItem label="Recorded by" value={record.recordedBy?.name || record.createdBy?.name} />
          <DetailItem label="Assigned officer" value={record.assignedOfficer?.name} />
          <DetailItem label="Assigned at" value={formatDate(record.assignedAt)} />
          <DetailItem label="Created" value={formatDate(record.createdAt)} />
          <DetailItem label="Updated by" value={record.updatedBy?.name} />
          {record.complaint?.complaintNumber ? (
            <DetailItem label="Linked complaint" value={record.complaint.complaintNumber} />
          ) : null}
        </div>
      </section>

      <section className="panel panel--nested">
        <div className="panel__header">
          <h3>Investigation / Follow-up</h3>
        </div>
        <div className="detail-grid">
          <DetailItem label="Action taken" value={record.actionTaken} />
          <DetailItem label="Follow-up date" value={formatDateOnly(record.followUpDate)} />
          <DetailItem label="Outcome" value={record.outcome} />
        </div>
        <div className="detail-block">
          <p className="detail-label">Follow-up notes</p>
          <p>{record.followUpNotes || '—'}</p>
        </div>
        {record.additionalNotes ? (
          <div className="detail-block">
            <p className="detail-label">Additional notes</p>
            <p>{record.additionalNotes}</p>
          </div>
        ) : null}
      </section>

      <section className="panel panel--nested">
        <div className="panel__header">
          <h3>Closure</h3>
        </div>
        <div className="detail-grid">
          <DetailItem label="Closing officer" value={record.closedBy?.name} />
          <DetailItem label="Closing date" value={formatDate(record.closedAt)} />
          <DetailItem label="Closure notes" value={record.closureReason} />
        </div>
      </section>

      <section className="panel panel--nested">
        <div className="panel__header">
          <h3>Activity History</h3>
          <p className="muted">Audit trail — cannot be edited manually.</p>
        </div>
        {(record.activityHistory || []).length === 0 ? (
          <p className="muted">No activity recorded yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date / time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Previous</th>
                  <th>New</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {[...(record.activityHistory || [])]
                  .slice()
                  .reverse()
                  .map((item, index) => (
                    <tr key={`${item.createdAt}-${index}`}>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>{item.user?.name || '—'}</td>
                      <td>{item.action}</td>
                      <td className="cell-clamp">{item.previousValue || '—'}</td>
                      <td className="cell-clamp">{item.newValue || '—'}</td>
                      <td className="cell-clamp">{item.note || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
