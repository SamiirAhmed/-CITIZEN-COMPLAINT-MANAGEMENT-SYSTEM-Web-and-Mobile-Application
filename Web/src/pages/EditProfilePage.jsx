import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  changePassword,
  getCurrentUser,
  updateProfile,
} from '../services/profileService';
import {
  defaultUsernameFromUser,
  validateProfileForm,
} from '../validation/profileValidation';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  address: '',
  username: '',
  avatar: '',
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

function mapUserToForm(user) {
  return {
    ...EMPTY_FORM,
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    username: defaultUsernameFromUser(user),
    avatar: user?.avatar || '',
  };
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(() => mapUserToForm(user));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError('');
      try {
        const profile = await getCurrentUser();
        if (!active) {
          return;
        }
        if (profile) {
          setUser(profile);
          setForm(mapUserToForm(profile));
        } else if (user) {
          setForm(mapUserToForm(user));
        }
      } catch (err) {
        if (!active) {
          return;
        }
        if (user) {
          setForm(mapUserToForm(user));
        }
        setError(err.message || 'Unable to load profile.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [setUser, user?.id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSuccess('');
    setError('');
  }

  function handleCancel() {
    navigate('/dashboard');
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 450 * 1024) {
      setError('Profile photo must be smaller than 450 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setForm((prev) => ({ ...prev, avatar: result }));
      setSuccess('');
      setError('');
    };
    reader.onerror = () => {
      setError('Unable to read the selected image.');
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSuccess('');
    setError('');

    const validation = validateProfileForm(form);
    setErrors(validation.errors);
    if (!validation.ok) {
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({
        name: validation.data.name,
        email: validation.data.email,
        phone: validation.data.phone,
        address: validation.data.address,
        username: validation.data.username,
        avatar: validation.data.avatar,
      });

      if (validation.data.wantsPasswordChange) {
        await changePassword({
          currentPassword: validation.data.currentPassword,
          newPassword: validation.data.newPassword,
          confirmPassword: validation.data.confirmNewPassword,
        });
      }

      if (result.user) {
        setUser(result.user);
        setForm({
          ...mapUserToForm(result.user),
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } else {
        setForm((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        }));
      }

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-stack">
        <section className="panel">
          <div className="state-box">Loading profile...</div>
        </section>
      </div>
    );
  }

  const initials = (form.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="page-stack edit-profile">
      <section className="panel edit-profile__hero">
        <div>
          <p className="admin-header__eyebrow">Account</p>
          <h2>Edit Profile</h2>
          <p className="muted">
            Update your personal details, contact information, and password.
          </p>
        </div>
      </section>

      {success ? <div className="alert alert--success">{success}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <form className="edit-profile__form" onSubmit={handleSubmit} noValidate>
        <section className="panel">
          <div className="panel__header">
            <div>
              <h3>Profile Photo</h3>
              <p className="muted">Upload a clear photo for your staff account.</p>
            </div>
          </div>

          <div className="edit-profile__photo">
            <div className="edit-profile__avatar" aria-hidden="true">
              {form.avatar ? (
                <img src={form.avatar} alt="" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="edit-profile__photo-actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleUploadClick}
              >
                Upload Photo
              </button>
              <p className="muted">JPG or PNG, up to 450 KB.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoChange}
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h3>Personal Information</h3>
              <p className="muted">These details are used across the SPO admin portal.</p>
            </div>
          </div>

          <div className="form-grid edit-profile__grid">
            <label className="field">
              <span>Full Name</span>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
              {errors.name ? <em className="field-error">{errors.name}</em> : null}
            </label>

            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
              {errors.email ? <em className="field-error">{errors.email}</em> : null}
            </label>

            <label className="field">
              <span>Phone Number</span>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                required
              />
              {errors.phone ? <em className="field-error">{errors.phone}</em> : null}
            </label>

            <label className="field">
              <span>Username</span>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
              {errors.username ? (
                <em className="field-error">{errors.username}</em>
              ) : null}
            </label>

            <label className="field edit-profile__full">
              <span>Address</span>
              <input
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                autoComplete="street-address"
                required
              />
              {errors.address ? (
                <em className="field-error">{errors.address}</em>
              ) : null}
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h3>Change Password</h3>
              <p className="muted">
                Leave these fields blank if you do not want to change your password.
              </p>
            </div>
          </div>

          <div className="form-grid edit-profile__grid">
            <label className="field">
              <span>Current Password</span>
              <input
                name="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={handleChange}
                autoComplete="current-password"
              />
              {errors.currentPassword ? (
                <em className="field-error">{errors.currentPassword}</em>
              ) : null}
            </label>

            <label className="field">
              <span>New Password</span>
              <input
                name="newPassword"
                type="password"
                value={form.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.newPassword ? (
                <em className="field-error">{errors.newPassword}</em>
              ) : null}
            </label>

            <label className="field">
              <span>Confirm New Password</span>
              <input
                name="confirmNewPassword"
                type="password"
                value={form.confirmNewPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.confirmNewPassword ? (
                <em className="field-error">{errors.confirmNewPassword}</em>
              ) : null}
            </label>
          </div>
        </section>

        <div className="form-actions edit-profile__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
