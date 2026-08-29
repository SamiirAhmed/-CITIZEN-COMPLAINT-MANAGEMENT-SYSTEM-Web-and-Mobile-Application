import { useEffect, useState } from 'react';
import { validateCitizenEdit } from '../../validation/citizenValidation';

const INITIAL = { name: '', phone: '', tell: '' };

export default function CitizenForm({
  initialValues = INITIAL,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Save changes',
}) {
  const [values, setValues] = useState({ ...INITIAL, ...initialValues });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setValues({ ...INITIAL, ...initialValues });
    setErrors({});
    setFormError('');
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validation = validateCitizenEdit(values);
    setErrors(validation.errors);
    if (!validation.ok) return;

    try {
      await onSubmit(validation.data);
    } catch (error) {
      setFormError(error.message || 'Unable to save citizen.');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <label className="field">
        <span>Name</span>
        <input
          name="name"
          value={values.name}
          onChange={handleChange}
          maxLength={30}
          autoComplete="name"
        />
        {errors.name ? <em className="field-error">{errors.name}</em> : null}
      </label>

      <label className="field">
        <span>Phone</span>
        <input
          name="phone"
          value={values.phone}
          onChange={handleChange}
          autoComplete="tel"
        />
        {errors.phone ? <em className="field-error">{errors.phone}</em> : null}
      </label>

      <label className="field">
        <span>Tell</span>
        <input
          name="tell"
          value={values.tell}
          onChange={handleChange}
          autoComplete="tel"
        />
        {errors.tell ? <em className="field-error">{errors.tell}</em> : null}
      </label>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
