import { useState } from 'react';
import { validateChangePassword } from '../../validation/profileValidation';

export default function ChangePasswordForm({
  submitting = false,
  onCancel,
  onSubmit,
  submitLabel = 'Update Password',
  hideCancel = false,
}) {
  const [values, setValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validation = validateChangePassword(values);
    setErrors(validation.errors);
    if (!validation.ok) return;

    try {
      await onSubmit(validation.data);
      setValues({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setFormError(error.message || 'Unable to change password.');
    }
  };

  return (
    <form className="form-grid form-grid--single" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <label className="field">
        <span>Current Password</span>
        <input
          name="currentPassword"
          type="password"
          value={values.currentPassword}
          onChange={handleChange}
          autoComplete="current-password"
        />
        <small className="field-hint">Enter your current password.</small>
        {errors.currentPassword ? (
          <em className="field-error">{errors.currentPassword}</em>
        ) : null}
      </label>

      <label className="field">
        <span>New Password</span>
        <input
          name="newPassword"
          type="password"
          value={values.newPassword}
          onChange={handleChange}
          autoComplete="new-password"
        />
        <small className="field-hint">Use at least 8 characters.</small>
        {errors.newPassword ? <em className="field-error">{errors.newPassword}</em> : null}
      </label>

      <label className="field">
        <span>Confirm New Password</span>
        <input
          name="confirmPassword"
          type="password"
          value={values.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
        />
        <small className="field-hint">Re-enter your new password.</small>
        {errors.confirmPassword ? (
          <em className="field-error">{errors.confirmPassword}</em>
        ) : null}
      </label>

      <div className="form-actions">
        {!hideCancel && onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Updating…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
