import Modal from '../common/Modal';

function recipientTypeLabel(recipientType, count = 1) {
  if (recipientType === 'citizen') {
    return count === 1 ? 'Citizen' : 'Citizens';
  }
  return count === 1 ? 'Police user' : 'Police users';
}

export default function SmsConfirmModal({
  open,
  recipients,
  reachCount,
  recipientType = 'police',
  message,
  sending,
  onCancel,
  onConfirm,
}) {
  const label = recipientTypeLabel(recipientType, reachCount);

  return (
    <Modal
      open={open}
      title="Send SMS?"
      onClose={sending ? undefined : onCancel}
      size="md"
      footer={
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" disabled={sending} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" disabled={sending} onClick={onConfirm}>
            {sending ? 'Sending SMS...' : 'Send SMS'}
          </button>
        </div>
      }
    >
      <div className="sms-confirm-modal">
        <div className="sms-confirm-modal__block">
          <strong>Recipients</strong>
          <p>
            {reachCount} {label}
          </p>
          {recipients.length ? (
            <ul>
              {recipients.map((recipient) => (
                <li key={recipient.id}>
                  {recipient.name} — {recipient.phone || 'No phone'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Select at least one {recipientTypeLabel(recipientType, 1)}.</p>
          )}
        </div>
        <div className="sms-confirm-modal__block">
          <strong>Message</strong>
          <p>{message}</p>
        </div>
      </div>
    </Modal>
  );
}
