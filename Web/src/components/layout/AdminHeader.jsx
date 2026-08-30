import { useAuth } from '../../context/AuthContext';

export default function AdminHeader({ title, onToggleSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <button
          type="button"
          className="icon-btn admin-header__menu"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          â˜°
        </button>
        <div>
          <p className="admin-header__eyebrow">SPO Admin Portal</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="admin-header__right">
        <div className="admin-header__user">
          <div className="admin-header__avatar" aria-hidden="true">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{user?.name || 'Administrator'}</strong>
            <span>{user?.role || 'admin'}</span>
          </div>
        </div>
        <button type="button" className="btn btn--ghost" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}

