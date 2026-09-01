import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import ProfileEditForm from '../components/profile/ProfileEditForm';
import Modal from '../components/common/Modal';
import ProfileAvatar from '../components/common/ProfileAvatar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { useAuth } from '../context/AuthContext';
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
} from '../services/profileService';
import { getRoleDisplayLabel } from '../validation/profileValidation';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

function SvgIcon({ d, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="currentColor" d={d} />
    </svg>
  );
}

const ICONS = {
  pencil:
    'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z',
  lock: 'M17 8h-1V6a4 4 0 0 0-8 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM10 6a2 2 0 0 1 4 0v2h-4V6Zm2 12.2A2.2 2.2 0 1 1 14.2 16 2.2 2.2 0 0 1 12 18.2Z',
  person:
    'M12 12a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12Zm0 2.1c-3.9 0-7.5 2-7.5 4.65V21h15v-2.25c0-2.65-3.6-4.65-7.5-4.65Z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.25-8 5.1-8-5.1V6l8 5.1L20 6Z',
  phone:
    'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1.05-.24 11.5 11.5 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.47a1 1 0 0 1 1 1 11.5 11.5 0 0 0 .57 3.6 1 1 0 0 1-.25 1.05Z',
  shield:
    'M12 2 4 5v6.1c0 5 3.4 9.5 8 11.1 4.6-1.6 8-6.1 8-11.1V5l-8-3Zm-1.1 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.4-4.4 1.4 1.4-5.8 5.8Z',
  pulse:
    'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 5h2v6h-2Zm0 8h2v2h-2Z',
  calendar:
    'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14Zm0-12H5V6h14Z',
  clock:
    'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.75 10.66-3.5 2.1-.75-1.24 2.75-1.65V7h1.5Z',
  badge:
    'M12 1.5 9.2 4.3H5.5v3.7L2.7 11l2.8 3v3.7h3.7L12 20.5l2.8-2.8h3.7V14l2.8-3-2.8-3V4.3h-3.7Z',
  building:
    'M4 21V7.5L12 3l8 4.5V21h-6.5v-6h-3v6Z',
};

function ProfileField({ icon, label, children }) {
  return (
    <div className="profile-field">
      <span className="profile-field__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="profile-field__body">
        <span className="profile-field__label">{label}</span>
        <div className="profile-field__value">{children}</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user: sessionUser, applyUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(sessionUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(
    () => location.hash === '#password'
  );
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const next = await getMyProfile();
      setProfile(next);
      applyUser(next);
    } catch (err) {
      setError(err.message || 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (location.hash === '#password') {
      setPasswordOpen(true);
    }
  }, [location.hash]);

  const handleEditSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const updated = await updateMyProfile(payload);
      setProfile(updated);
      applyUser(updated);
      setEditOpen(false);
      setNotice('Profile updated successfully.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const message = await changeMyPassword(payload);
      setPasswordOpen(false);
      setNotice(message || 'Password changed successfully.');
      if (location.hash === '#password') {
        navigate('/profile', { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading profile…" />;
  if (error && !profile) return <ErrorState message={error} onRetry={load} />;
  if (!profile) return <ErrorState message="Profile not found." onRetry={load} />;

  const roleLabel = getRoleDisplayLabel(profile.role);
  const active = profile.isActive !== false;
  const isPolice = profile.role === 'police';

  return (
    <div className="page-stack profile-page">
      {notice ? <div className="alert alert--success">{notice}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="panel profile-hero-card">
        <div className="profile-hero-card__glow" aria-hidden="true" />
        <div className="profile-hero-card__inner">
          <div className="profile-hero-card__media">
            <ProfileAvatar
              name={profile.name}
              src={profile.profileImage}
              size={128}
              className="profile-avatar--ring profile-avatar--lg profile-avatar--hero"
            />
          </div>
          <div className="profile-hero-card__copy">
            <p className="profile-hero-card__eyebrow">
              {isPolice ? 'Police Profile' : 'Admin Profile'}
            </p>
            <h1>
              {profile.name || (isPolice ? 'Police Officer' : 'System Administrator')}
            </h1>
            <p className="profile-hero-card__role">{roleLabel}</p>
            <div className="profile-hero__badges">
              <StatusBadge status={active ? 'Active' : 'Inactive'} />
            </div>
          </div>
          <div className="profile-hero-card__actions">
            <button
              type="button"
              className="btn btn--primary profile-hero-card__btn"
              onClick={() => {
                setNotice('');
                setEditOpen(true);
              }}
            >
              <SvgIcon d={ICONS.pencil} size={16} />
              Edit Profile
            </button>
            <button
              type="button"
              className="btn btn--ghost profile-hero-card__btn profile-hero-card__btn--outline"
              onClick={() => {
                setNotice('');
                setPasswordOpen(true);
              }}
            >
              <SvgIcon d={ICONS.lock} size={16} />
              Change Password
            </button>
          </div>
        </div>
      </section>

      <div className="profile-info-grid">
        <section className="panel profile-info-card">
          <div className="panel__header profile-info-card__header">
            <span className="profile-info-card__title-icon" aria-hidden="true">
              <SvgIcon d={ICONS.person} size={18} />
            </span>
            <h2>Personal Information</h2>
          </div>
          <div className="profile-fields">
            <ProfileField
              icon={<SvgIcon d={ICONS.person} />}
              label="Name"
            >
              <strong>{profile.name || '—'}</strong>
            </ProfileField>
            <ProfileField
              icon={<SvgIcon d={ICONS.mail} />}
              label="Email"
            >
              <strong>{profile.email || '—'}</strong>
            </ProfileField>
            <ProfileField
              icon={<SvgIcon d={ICONS.phone} />}
              label="Phone"
            >
              <strong>{profile.phone || '—'}</strong>
            </ProfileField>
          </div>
        </section>

        <section className="panel profile-info-card">
          <div className="panel__header profile-info-card__header">
            <span className="profile-info-card__title-icon" aria-hidden="true">
              <SvgIcon d={ICONS.shield} size={18} />
            </span>
            <h2>Account Information</h2>
          </div>
          <div className="profile-fields">
            <ProfileField
              icon={<SvgIcon d={ICONS.shield} />}
              label="User Type"
            >
              <strong>{roleLabel}</strong>
            </ProfileField>
            <ProfileField
              icon={<SvgIcon d={ICONS.pulse} />}
              label="Status"
            >
              <StatusBadge status={active ? 'Active' : 'Inactive'} />
            </ProfileField>
            <ProfileField
              icon={<SvgIcon d={ICONS.calendar} />}
              label="Created"
            >
              <strong>{formatDate(profile.createdAt)}</strong>
            </ProfileField>
            <ProfileField
              icon={<SvgIcon d={ICONS.clock} />}
              label="Updated"
            >
              <strong>{formatDate(profile.updatedAt)}</strong>
            </ProfileField>
            {isPolice ? (
              <>
                <ProfileField
                  icon={<SvgIcon d={ICONS.badge} />}
                  label="Badge number"
                >
                  <strong>{profile.badgeNumber || '—'}</strong>
                </ProfileField>
                <ProfileField
                  icon={<SvgIcon d={ICONS.building} />}
                  label="Station"
                >
                  <strong>{profile.station || '—'}</strong>
                </ProfileField>
              </>
            ) : null}
          </div>
        </section>
      </div>

      <Modal
        open={editOpen}
        title="Edit Profile"
        onClose={() => setEditOpen(false)}
        size="lg"
      >
        <ProfileEditForm
          user={profile}
          submitting={submitting}
          onCancel={() => setEditOpen(false)}
          onSubmit={handleEditSubmit}
        />
      </Modal>

      <Modal
        open={passwordOpen}
        title="Change Password"
        onClose={() => {
          setPasswordOpen(false);
          if (location.hash === '#password') {
            navigate('/profile', { replace: true });
          }
        }}
      >
        <ChangePasswordForm
          submitting={submitting}
          onCancel={() => {
            setPasswordOpen(false);
            if (location.hash === '#password') {
              navigate('/profile', { replace: true });
            }
          }}
          onSubmit={handlePasswordSubmit}
        />
      </Modal>
    </div>
  );
}
