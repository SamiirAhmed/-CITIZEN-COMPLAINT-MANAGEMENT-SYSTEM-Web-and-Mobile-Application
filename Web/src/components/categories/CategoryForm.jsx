import { useEffect, useState } from 'react';

const INITIAL = { name: '', description: '' };

export default function CategoryForm({
  initialValues = INITIAL,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Save category',
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

    const name = String(values.name ?? '').trim();
    const description = String(values.description ?? '').trim();
    const nextErrors = {};

    if (!name) {
      nextErrors.name = 'Category name is required.';
    } else if (name.length > 60) {
      nextErrors.name = 'Category name must be at most 60 characters.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await onSubmit({ name, description });
    } catch (error) {
      setFormError(error.message || 'Unable to save category.');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <label className="field">
        <span>Category Name</span>
        <input
          name="name"
          value={values.name}
          onChange={handleChange}
          maxLength={60}
          autoFocus
        />
        {errors.name ? <em className="field-error">{errors.name}</em> : null}
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          name="description"
          value={values.description}
          onChange={handleChange}
          rows={3}
          placeholder="Optional description"
        />
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
