import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../common/ConfirmDialog';
import ProfileAvatar from '../common/ProfileAvatar';
import { useAuth } from '../../context/AuthContext';
import { getRoleDisplayLabel } from '../../validation/profileValidation';

export default function AdminProfileMenu({ showMeta = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const rootRef = useRef(null);

  const displayName = user?.name || 'System Administrator';
  const roleLabel = getRoleDisplayLabel(user?.role);
  const active = user?.isActive !== false;

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSignOutClick = () => {
    setOpen(false);
    setSignOutOpen(true);
  };

  const confirmSignOut = () => {
    const loginPath = user?.role === 'police' ? '/police/login' : '/login';
    setSignOutOpen(false);
    logout();
    navigate(loginPath, { replace: true });
  };

  return (
    <div className="header-menu" ref={rootRef}>
      <button
        type="button"
        className="profile-trigger"
        aria-label={`Account menu for ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ProfileAvatar
          name={displayName}
          src={user?.profileImage}
          size={36}
          previewable={false}
        />
        {showMeta ? (
          <span className="profile-trigger__meta">
            <strong>{displayName}</strong>
          </span>
        ) : null}
        <span className="profile-trigger__chevron" aria-hidden="true">
          ⌄
        </span>
      </button>

      {open ? (
        <div className="header-popover profile-popover" role="menu">
          <div className="profile-popover__identity">
            <ProfileAvatar
              name={displayName}
              src={user?.profileImage}
              size={52}
              previewable={false}
            />
            <div>
              <strong>{displayName}</strong>
              <span>{roleLabel}</span>
              <span className={`profile-popover__status ${active ? 'is-active' : 'is-inactive'}`}>
                <i aria-hidden="true" />
                {active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="header-popover__list">
            <Link
              to="/profile"
              role="menuitem"
              className="header-popover__item"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            <Link
              to="/profile#password"
              role="menuitem"
              className="header-popover__item"
              onClick={() => setOpen(false)}
            >
              Change Password
            </Link>
            <button
              type="button"
              role="menuitem"
              className="header-popover__item header-popover__item--danger"
              onClick={handleSignOutClick}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={signOutOpen}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setSignOutOpen(false)}
        onConfirm={confirmSignOut}
      />
    </div>
  );
}
