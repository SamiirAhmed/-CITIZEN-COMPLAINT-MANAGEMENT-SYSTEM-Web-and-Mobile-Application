import Modal from '../common/Modal';

export default function SmsConfirmModal({
  open,
  recipients,
  reachCount,
  message,
  sending,
  onCancel,
  onConfirm,
}) {
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
            {reachCount} Police user{reachCount === 1 ? '' : 's'}
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
            <p className="muted">Select at least one Police user.</p>
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
