const SMS_MAX_LENGTH = 160;

export default function SmsMessageField({ value, onChange, maxLength = SMS_MAX_LENGTH }) {
  const length = value.length;

  return (
    <div className="sms-message-field">
      <label className="field field--full">
        <span>Message</span>
        <textarea
          rows={6}
          value={value}
          maxLength={maxLength}
          placeholder="Write your SMS message here..."
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <p className={`sms-message-field__count ${length > maxLength ? 'is-over' : ''}`}>
        {length} / {maxLength}
      </p>
    </div>
  );
}

export { SMS_MAX_LENGTH };
