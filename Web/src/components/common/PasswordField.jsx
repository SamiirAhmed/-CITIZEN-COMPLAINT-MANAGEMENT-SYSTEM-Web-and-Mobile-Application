import { useState } from 'react';

/** Password field with show/hide toggle. */
export default function PasswordField({
  name = 'password',
  label = 'Password',
  value = '',
  onChange,
  error = '',
  autoComplete = 'new-password',
  disabled = false,
  hint = '',
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="field">
      <span>{label}</span>
      <div className="password-field">
        <span className="password-field__lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="currentColor"
              d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 5a3 3 0 0 1 6 0v3H9V6zm3 8a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"
            />
          </svg>
        </span>
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          disabled={disabled}
          className={error ? 'is-invalid' : undefined}
        />
        <button
          type="button"
          className="password-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 6c3.8 0 7.2 2.1 9 5.5-.5 1-1.2 1.9-2 2.7l1.4 1.4-1.4 1.4-1.5-1.5A11 11 0 0 1 12 17c-3.8 0-7.2-2.1-9-5.5.5-1 1.2-1.9 2-2.7L3.5 7.3 4.9 5.9l1.5 1.5A11 11 0 0 1 12 6zm0 2c-1.2 0-2.3.3-3.3.9l1.6 1.6c.5-.3 1.1-.5 1.7-.5a3 3 0 0 1 3 3c0 .6-.2 1.2-.5 1.7l1.6 1.6c.6-1 1-2.1 1-3.3A5 5 0 0 0 12 8zm0 10c1.2 0 2.3-.3 3.3-.9l-1.6-1.6c-.5.3-1.1.5-1.7.5a3 3 0 0 1-3-3c0-.6.2-1.2.5-1.7L8.9 9.7C8.3 10.7 8 11.8 8 13a5 5 0 0 0 4 4.9V18z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 5c-5 0-9.3 3.1-11 7 1.7 3.9 6 7 11 7s9.3-3.1 11-7c-1.7-3.9-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
              />
            </svg>
          )}
        </button>
      </div>
      {hint ? <small className="field-hint">{hint}</small> : null}
      {error ? <em className="field-error">{error}</em> : null}
    </label>
  );
}
