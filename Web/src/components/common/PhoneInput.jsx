export default function PhoneInput({
  name = 'phone',
  value = '',
  onChange,
  error,
  autoComplete = 'tel',
  disabled = false,
}) {
  const raw = String(value ?? '').trim();
  const displayValue = raw.replace(/^\+?252[\s-]*/i, '');

  const handleChange = (event) => {
    const digits = event.target.value.replace(/[^\d\s-]/g, '');
    const next = digits.trim() ? `+252${digits.replace(/[\s-]/g, '')}` : '';
    onChange?.({
      ...event,
      target: {
        ...event.target,
        name,
        value: next,
      },
    });
  };

  return (
    <label className="field">
      <span>Phone Number</span>
      <div className="phone-input">
        <span className="phone-input__prefix" aria-hidden="true">
          +252
        </span>
        <input
          name={name}
          value={displayValue}
          onChange={handleChange}
          autoComplete={autoComplete}
          disabled={disabled}
          placeholder="61XXXXXXX"
          inputMode="tel"
        />
      </div>
      {error ? <em className="field-error">{error}</em> : null}
    </label>
  );
}
