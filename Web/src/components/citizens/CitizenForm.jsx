import { useEffect, useState } from 'react';
import PhoneInput from '../common/PhoneInput';
import ProfileImageField from '../common/ProfileImageField';
import PasswordField from '../common/PasswordField';
import {
  validateCitizenEdit,
  validateCitizenRegistration,
} from '../../validation/citizenValidation';
import { EMAIL_PATTERN } from '../../validation/userValidation';

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
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    if (isRegister) {
      setValues({ ...REGISTER_INITIAL });
    } else {
      setValues({ ...EDIT_INITIAL, ...initialValues });
    }
    setProfileImageFile(null);
    setErrors({});
    setFormError('');
    setEmailTouched(false);
  }, [initialValues, isRegister]);

  const clearFieldError = (name) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === 'name') {
      nextValue = value.replace(/[^A-Za-z\s]/g, '').slice(0, 30);
    } else if (name === 'niraId') {
      nextValue = value.replace(/\D/g, '').slice(0, 11);
    }

    setValues((prev) => {
      const next = { ...prev, [name]: nextValue };
      if (name === 'password' || name === 'confirmPassword') {
        if (
          next.confirmPassword &&
          next.password &&
          next.password === next.confirmPassword
        ) {
          clearFieldError('confirmPassword');
        }
        if (name === 'password' && nextValue.length >= 8) {
          clearFieldError('password');
        }
      }
      return next;
    });
    if (name === 'email') clearFieldError('email');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setEmailTouched(true);
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

  const showEmailError =
    emailTouched &&
    values.email.trim() &&
    !EMAIL_PATTERN.test(values.email.trim().toLowerCase())
      ? 'Please enter a valid email address.'
      : errors.email || '';

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
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={() => setEmailTouched(true)}
          className={showEmailError ? 'is-invalid' : undefined}
          autoComplete="email"
        />
        {showEmailError ? <em className="field-error">{showEmailError}</em> : null}
      </label>

      {isRegister ? (
        <>
          <PasswordField
            name="password"
            label="Password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            disabled={submitting}
          />
          <PasswordField
            name="confirmPassword"
            label="Confirm Password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            disabled={submitting}
          />
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
