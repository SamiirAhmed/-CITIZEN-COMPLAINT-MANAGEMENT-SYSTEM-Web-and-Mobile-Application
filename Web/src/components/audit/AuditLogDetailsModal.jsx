import Modal from '../common/Modal';

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="audit-detail__row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function statusLabel(status, action) {
  if (status === 'failed' || action === 'LOGIN_FAILED') return 'Failed';
  if (status === 'success' || ['LOGIN_SUCCESS', 'LOGOUT', 'PASSWORD_CHANGED', 'LOGIN'].includes(action)) {
    return 'Successful';
  }
  if (status === 'info') return 'Info';
  if (status === 'warning') return 'Warning';
  return status || '—';
}

export default function AuditLogDetailsModal({ open, log, onClose }) {
  if (!log) return null;

  return (
    <Modal open={open} title="Audit Log Details" onClose={onClose} size="lg">
      <div className="audit-detail">
        <DetailRow label="User" value={log.actorName} />
        <DetailRow label="Email" value={log.email} />
        <DetailRow label="Role" value={log.actorRole} />
        <DetailRow label="Action" value={log.action} />
        <DetailRow label="Status" value={statusLabel(log.status, log.action)} />
        <DetailRow
          label="Date/Time"
          value={log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
        />
        <DetailRow label="IP Address" value={log.ipAddress} />
        <DetailRow label="Device" value={log.device} />
        <DetailRow label="Browser" value={log.browser} />
        <DetailRow label="Operating System" value={log.operatingSystem} />
        <DetailRow label="Access Source" value={log.accessSource} />
        <DetailRow label="Location" value={log.location || 'Not available'} />
        <DetailRow label="Related Record" value={`${log.recordType || '—'} ${log.recordLabel || log.recordId || ''}`.trim()} />
        <DetailRow label="Previous Value" value={log.previousValue} />
        <DetailRow label="New Value" value={log.newValue} />
        <DetailRow label="Details" value={log.details} />
        <DetailRow label="User Agent" value={log.userAgent} />
      </div>
    </Modal>
  );
}
