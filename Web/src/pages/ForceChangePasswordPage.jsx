import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LOGO_SRC from '../assets/branding';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import { useAuth } from '../context/AuthContext';
import { getFirstAllowedPath } from '../navigation/adminNavigation';
import { changeMyPassword } from '../services/profileService';

export default function ForceChangePasswordPage() {
  const { isAuthenticated, user, applyUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.passwordChangeRequired) {
    return <Navigate to={getFirstAllowedPath(user)} replace />;
  }

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const updated = await changeMyPassword(payload);
      if (updated) {
        applyUser(updated);
      }
      navigate(getFirstAllowedPath(updated || user), { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__panel">
        <div className="login-page__brand">
          <img src={LOGO_SRC} alt="SPO logo" />
          <div>
            <p className="login-page__system">SPO — Somali Police OBE</p>
            <h1>Change Password</h1>
            <p className="muted">
              For your security, you must set a new password before continuing.
            </p>
          </div>
        </div>

        <ChangePasswordForm
          submitting={submitting}
          submitLabel="Change Password"
          hideCancel
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
