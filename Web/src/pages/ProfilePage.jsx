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
      const updated = await changeMyPassword(payload);
      if (updated) {
        setProfile(updated);
        applyUser(updated);
      }
      setPasswordOpen(false);
      setNotice('Password changed successfully.');
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

  return (
    <div className="page-stack profile-page">
      {notice ? <div className="alert alert--success">{notice}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="panel profile-hero-card">
        <div className="profile-hero-card__media">
          <ProfileAvatar
            name={profile.name}
            src={profile.profileImage}
            size={128}
            className="profile-avatar--ring profile-avatar--lg"
          />
        </div>
        <div className="profile-hero-card__copy">
          <p className="settings-hub__eyebrow">
            {profile.role === 'police' ? 'Police Profile' : 'Admin Profile'}
          </p>
          <h1>{profile.name || (profile.role === 'police' ? 'Police Officer' : 'System Administrator')}</h1>
          <p className="profile-hero-card__role">{roleLabel}</p>
          <div className="profile-hero__badges">
            <StatusBadge status={active ? 'Active' : 'Inactive'} />
          </div>
          <div className="profile-hero-card__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setNotice('');
                setEditOpen(true);
              }}
            >
              Edit Profile
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setNotice('');
                setPasswordOpen(true);
              }}
            >
              Change Password
            </button>
          </div>
        </div>
      </section>

      <div className="profile-info-grid">
        <section className="panel">
          <div className="panel__header">
            <h2>Personal Information</h2>
          </div>
          <div className="detail-grid">
            <div>
              <span className="detail-label">Name</span>
              <strong>{profile.name || '—'}</strong>
            </div>
            <div>
              <span className="detail-label">Email</span>
              <strong>{profile.email || '—'}</strong>
            </div>
            <div>
              <span className="detail-label">Phone</span>
              <strong>{profile.phone || '—'}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2>Account Information</h2>
          </div>
          <div className="detail-grid">
            <div>
              <span className="detail-label">User Type</span>
              <strong>{roleLabel}</strong>
            </div>
            <div>
              <span className="detail-label">Status</span>
              <StatusBadge status={active ? 'Active' : 'Inactive'} />
            </div>
            <div>
              <span className="detail-label">Created</span>
              <strong>{formatDate(profile.createdAt)}</strong>
            </div>
            <div>
              <span className="detail-label">Updated</span>
              <strong>{formatDate(profile.updatedAt)}</strong>
            </div>
            {profile.role === 'police' ? (
              <>
                <div>
                  <span className="detail-label">Badge number</span>
                  <strong>{profile.badgeNumber || '—'}</strong>
                </div>
                <div>
                  <span className="detail-label">Station</span>
                  <strong>{profile.station || '—'}</strong>
                </div>
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
