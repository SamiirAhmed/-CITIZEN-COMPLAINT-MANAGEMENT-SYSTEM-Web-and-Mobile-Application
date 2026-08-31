import { useEffect, useState } from 'react';
import PhoneInput from '../common/PhoneInput';
import ProfileImageField from '../common/ProfileImageField';
import {
  validateCitizenEdit,
  validateCitizenRegistration,
} from '../../validation/citizenValidation';

const REGISTER_INITIAL = {
  name: '',
  phone: '',
  email: '',
  niraId: '',
  password: '',
  confirmPassword: '',
};

const EDIT_INITIAL = { name: '', phone: '', email: '', niraId: '' };

export default function CitizenForm({
  mode = 'edit',
  initialValues,
  currentImage = '',
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel,
}) {
  const isRegister = mode === 'register';
  const [values, setValues] = useState(
    isRegister ? { ...REGISTER_INITIAL } : { ...EDIT_INITIAL, ...initialValues }
  );
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isRegister) {
      setValues({ ...REGISTER_INITIAL });
    } else {
      setValues({ ...EDIT_INITIAL, ...initialValues });
    }
    setProfileImageFile(null);
    setErrors({});
    setFormError('');
  }, [initialValues, isRegister]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    let next = value;

    if (name === 'name') {
      next = value.replace(/[^A-Za-z\s]/g, '').slice(0, 30);
    } else if (name === 'niraId') {
      next = value.replace(/\D/g, '').slice(0, 11);
    }

    setValues((prev) => ({ ...prev, [name]: next }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validation = isRegister
      ? validateCitizenRegistration(values, { profileImageFile })
      : validateCitizenEdit(values, { profileImageFile });
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
        required={isRegister}
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
          inputMode="text"
          pattern="[A-Za-z\s]+"
        />
        {errors.name ? <em className="field-error">{errors.name}</em> : null}
      </label>

      <label className="field">
        <span>NIRA ID</span>
        <input
          name="niraId"
          value={values.niraId}
          onChange={handleChange}
          maxLength={11}
          inputMode="numeric"
          pattern="\d{11}"
        />
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

      {isRegister ? (
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
          {submitting
            ? 'Saving…'
            : submitLabel || (isRegister ? 'Register citizen' : 'Save changes')}
        </button>
      </div>
    </form>
  );
}
