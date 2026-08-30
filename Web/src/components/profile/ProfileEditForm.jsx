import { useEffect, useState } from 'react';
import PhoneInput from '../common/PhoneInput';
import ProfileImageField from '../common/ProfileImageField';
import { getRoleDisplayLabel, validateProfileEdit } from '../../validation/profileValidation';

export default function ProfileEditForm({
  user,
  submitting = false,
  onCancel,
  onSubmit,
}) {
  const [values, setValues] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setValues({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setProfileImageFile(null);
    setErrors({});
    setFormError('');
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validation = validateProfileEdit(values, { profileImageFile });
    setErrors(validation.errors);
    if (!validation.ok) return;

    try {
      await onSubmit(validation.data);
    } catch (error) {
      setFormError(error.message || 'Unable to update profile.');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <ProfileImageField
        name={values.name}
        currentSrc={user?.profileImage || ''}
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
        <span>Email</span>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          autoComplete="email"
        />
        {errors.email ? <em className="field-error">{errors.email}</em> : null}
      </label>

      <PhoneInput
        name="phone"
        value={values.phone}
        onChange={handleChange}
        error={errors.phone}
      />

      <label className="field">
        <span>User Type</span>
        <input
          value={getRoleDisplayLabel(user?.role)}
          readOnly
          disabled
          className="input--readonly"
        />
        <em className="field-hint">User type cannot be changed from Profile.</em>
      </label>

      <label className="field">
        <span>Status</span>
        <input
          value={user?.isActive !== false ? 'Active' : 'Inactive'}
          readOnly
          disabled
          className="input--readonly"
        />
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
