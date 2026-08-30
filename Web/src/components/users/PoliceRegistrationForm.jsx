import { useEffect, useState } from 'react';
import PhoneInput from '../common/PhoneInput';
import ProfileImageField from '../common/ProfileImageField';
import { validatePoliceRegistration, validateStaffUserEdit } from '../../validation/userValidation';

const REGISTER_INITIAL = {
  name: '',
  niraId: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  badgeNumber: '',
  station: '',
};

const EDIT_INITIAL = {
  name: '',
  phone: '',
  email: '',
  badgeNumber: '',
  station: '',
};

export default function PoliceRegistrationForm({
  mode = 'register',
  initialValues,
  currentImage = '',
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState(
    isEdit ? { ...EDIT_INITIAL, ...initialValues } : { ...REGISTER_INITIAL }
  );
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isEdit) {
      setValues({ ...EDIT_INITIAL, ...initialValues });
    } else {
      setValues({ ...REGISTER_INITIAL });
    }
    setProfileImageFile(null);
    setErrors({});
    setFormError('');
  }, [initialValues, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validation = isEdit
      ? validateStaffUserEdit(values, { profileImageFile })
      : validatePoliceRegistration(values, { profileImageFile });
    setErrors(validation.errors);
    if (!validation.ok) return;

    try {
      await onSubmit(validation.data);
    } catch (error) {
      setFormError(error.message || 'Unable to save user.');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <ProfileImageField
        name={values.name}
        currentSrc={currentImage}
        required={!isEdit}
        valueFile={profileImageFile}
        onChange={setProfileImageFile}
        error={errors.profileImage}
        disabled={submitting}
      />

      <label className="field">
        <span>Name</span>
        <input name="name" value={values.name} onChange={handleChange} maxLength={30} />
        {errors.name ? <em className="field-error">{errors.name}</em> : null}
      </label>

      {!isEdit ? (
        <label className="field">
          <span>NIRA ID</span>
          <input name="niraId" value={values.niraId} onChange={handleChange} maxLength={11} />
          {errors.niraId ? <em className="field-error">{errors.niraId}</em> : null}
        </label>
      ) : null}

      <label className="field">
        <span>Email</span>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          disabled={!isEdit && false}
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
        <span>Role</span>
        <input value="Police Officer" readOnly disabled className="input--readonly" />
      </label>

      <label className="field">
        <span>Badge Number</span>
        <input name="badgeNumber" value={values.badgeNumber} onChange={handleChange} />
      </label>

      <label className="field">
        <span>Station</span>
        <input name="station" value={values.station} onChange={handleChange} />
      </label>

      {!isEdit ? (
        <>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.password ? <em className="field-error">{errors.password}</em> : null}
          </label>

          <label className="field">
            <span>Confirm Password</span>
            <input
              name="confirmPassword"
              type="password"
              value={values.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.confirmPassword ? (
              <em className="field-error">{errors.confirmPassword}</em>
            ) : null}
          </label>
        </>
      ) : null}

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Register police'}
        </button>
      </div>
    </form>
  );
}
