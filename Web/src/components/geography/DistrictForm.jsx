import { useState } from 'react';

const INITIAL = {
  district: '',
  village: '',
  area: '',
};

export default function DistrictForm({
  initialValues,
  submitting = false,
  submitLabel = 'Save',
  onCancel,
  onSubmit,
}) {
  const [values, setValues] = useState({ ...INITIAL, ...initialValues });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const nextErrors = {};
    const district = String(values.district ?? '').trim();
    const village = String(values.village ?? '').trim();
    const area = String(values.area ?? '').trim();

    if (!district) {
      nextErrors.district = 'District name is required.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await onSubmit({ district, village, area });
    } catch (error) {
      setFormError(error.message || 'Unable to save district.');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <p className="field-hint field--full" style={{ marginTop: 0 }}>
        All districts are registered under Banaadir (Mogadishu).
      </p>

      <label className="field field--full">
        <span>District</span>
        <input
          name="district"
          value={values.district}
          onChange={handleChange}
          placeholder="e.g. Kahda, Garasbaley, Dharkenley"
          disabled={submitting}
        />
        {errors.district ? <em className="field-error">{errors.district}</em> : null}
      </label>

      <label className="field">
        <span>Village (optional)</span>
        <input
          name="village"
          value={values.village}
          onChange={handleChange}
          placeholder="Optional village"
          disabled={submitting}
        />
      </label>

      <label className="field">
        <span>Area (optional)</span>
        <input
          name="area"
          value={values.area}
          onChange={handleChange}
          placeholder="Optional area"
          disabled={submitting}
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
