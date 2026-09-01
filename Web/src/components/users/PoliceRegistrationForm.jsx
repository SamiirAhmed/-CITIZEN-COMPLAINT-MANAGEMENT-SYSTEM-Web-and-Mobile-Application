import { useEffect, useState } from 'react';
import PhoneInput from '../common/PhoneInput';
import ProfileImageField from '../common/ProfileImageField';
import GeographicSelect from '../common/GeographicSelect';
import { validateStaffRegistration, validateStaffUserEdit } from '../../validation/userValidation';

const REGISTER_INITIAL = {
  name: '',
  niraId: '',
  phone: '',
  email: '',
  role: 'police',
  badgeNumber: '',
  station: '',
  region: '',
  district: '',
  village: '',
  area: '',
};

const EDIT_INITIAL = {
  name: '',
  phone: '',
  email: '',
  badgeNumber: '',
  station: '',
  region: '',
  district: '',
  village: '',
  area: '',
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
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setValues({ ...EDIT_INITIAL, ...initialValues });
    } else {
      setValues({ ...REGISTER_INITIAL });
    }
    setProfileImageFile(null);
    setErrors({});
    setFormError('');
    setEmailTouched(false);
  }, [initialValues, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    let next = value;

    if (name === 'name') {
      next = value.replace(/[^A-Za-z\s]/g, '').slice(0, 30);
    } else if (name === 'niraId') {
      next = value.replace(/\D/g, '').slice(0, 11);
    }

    setValues((prev) => ({ ...prev, [name]: next }));
    if (name === 'email' && errors.email) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors.email;
        return nextErrors;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setEmailTouched(true);
    const validation = isEdit
      ? validateStaffUserEdit(values, { profileImageFile })
      : validateStaffRegistration(values, { profileImageFile });
    setErrors(validation.errors);
    if (!validation.ok) return;

    try {
      await onSubmit(validation.data);
    } catch (error) {
      setFormError(error.message || 'Unable to save user.');
    }
  };

  const emailError = emailTouched || errors.email ? errors.email : '';

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

      {!isEdit ? (
        <label className="field">
          <span>Role</span>
          <select name="role" value={values.role} onChange={handleChange} disabled={submitting}>
            <option value="police">Police</option>
            <option value="admin">Admin</option>
          </select>
          <small className="field-hint">Select whether this account is Admin or Police.</small>
          {errors.role ? <em className="field-error">{errors.role}</em> : null}
        </label>
      ) : null}

      <label className="field">
        <span>Name</span>
        <input
          name="name"
          value={values.name}
          onChange={handleChange}
          maxLength={30}
          inputMode="text"
          pattern="[A-Za-z\s]+"
        />
        <small className="field-hint">Letters only. Enter the user&apos;s full name.</small>
        {errors.name ? <em className="field-error">{errors.name}</em> : null}
      </label>

      {!isEdit ? (
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
          <small className="field-hint">Enter exactly 11 numbers for the NIRA ID.</small>
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
          onBlur={() => setEmailTouched(true)}
          className={emailError ? 'is-invalid' : undefined}
          autoComplete="email"
        />
        <small className="field-hint">Enter a valid email address.</small>
        {emailError ? <em className="field-error">{emailError}</em> : null}
      </label>

      <PhoneInput
        name="phone"
        value={values.phone}
        onChange={handleChange}
        error={errors.phone}
      />

      <GeographicSelect
        region={values.region}
        district={values.district}
        village={values.village}
        area={values.area}
        onChange={({ region, district, village, area }) =>
          setValues((prev) => ({
            ...prev,
            region: region ?? prev.region,
            district: district ?? '',
            village: village ?? '',
            area: area ?? '',
          }))
        }
        districtError={errors.district}
        villageError={errors.village}
        areaError={errors.area}
        disabled={submitting}
      />

      <label className="field">
        <span>Badge Number</span>
        <input name="badgeNumber" value={values.badgeNumber} onChange={handleChange} />
        <small className="field-hint">Optional for admin accounts; required for police officers.</small>
        {errors.badgeNumber ? <em className="field-error">{errors.badgeNumber}</em> : null}
      </label>

      <label className="field">
        <span>Station</span>
        <input name="station" value={values.station} onChange={handleChange} />
        <small className="field-hint">Enter the assigned police station, if applicable.</small>
      </label>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Register user'}
        </button>
      </div>
    </form>
  );
}
