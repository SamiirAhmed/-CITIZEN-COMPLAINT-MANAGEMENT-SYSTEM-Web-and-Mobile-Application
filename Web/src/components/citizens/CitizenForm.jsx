import { useEffect, useState } from 'react';
import PhoneInput from '../common/PhoneInput';
import ProfileImageField from '../common/ProfileImageField';
import { validateCitizenEdit } from '../../validation/citizenValidation';

const INITIAL = { name: '', phone: '', email: '', niraId: '' };

export default function CitizenForm({
  initialValues = INITIAL,
  currentImage = '',
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Save changes',
}) {
  const [values, setValues] = useState({ ...INITIAL, ...initialValues });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setValues({ ...INITIAL, ...initialValues });
    setProfileImageFile(null);
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
    const validation = validateCitizenEdit(values, { profileImageFile });
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

      <ProfileImageField
        name={values.name}
        currentSrc={currentImage}
        valueFile={profileImageFile}
        onChange={setProfileImageFile}
        error={errors.profileImage}
        disabled={submitting}
      />

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
        <span>NIRA ID</span>
        <input name="niraId" value={values.niraId} onChange={handleChange} maxLength={11} />
        {errors.niraId ? <em className="field-error">{errors.niraId}</em> : null}
      </label>

      <PhoneInput
        name="phone"
        value={values.phone}
        onChange={handleChange}
        error={errors.phone}
      />

      <label className="field">
        <span>Email</span>
        <input name="email" type="email" value={values.email} onChange={handleChange} />
        {errors.email ? <em className="field-error">{errors.email}</em> : null}
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
