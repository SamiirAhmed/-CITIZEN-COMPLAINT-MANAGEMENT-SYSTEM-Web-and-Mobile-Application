export default function SelectedRecipients({ recipients, onRemove }) {
  if (!recipients.length) {
    return (
      <div className="sms-selected-empty">
        <p className="muted">No recipients selected yet.</p>
      </div>
    );
  }

  return (
    <div className="sms-selected-list">
      {recipients.map((recipient) => (
        <span key={recipient.id} className="sms-selected-chip">
          <span>
            {recipient.name} — {recipient.phone || 'No phone'}
          </span>
          <button
            type="button"
            className="sms-selected-chip__remove"
            aria-label={`Remove ${recipient.name}`}
            onClick={() => onRemove(recipient.id)}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
