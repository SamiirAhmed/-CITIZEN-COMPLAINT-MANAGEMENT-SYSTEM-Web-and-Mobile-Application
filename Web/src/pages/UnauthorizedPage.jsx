import { Navigate } from 'react-router-dom';
import { getHomePath, hasWebDashboard } from '../auth/roles';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  if (hasWebDashboard(user)) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header">
          <h2>Access unavailable</h2>
          <p className="muted">
            Signed in as {user?.email || 'this account'} ({user?.role || 'unknown role'}). This web
            portal does not have a dashboard for that role yet. Citizens should use the mobile app.
          </p>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--primary" onClick={logout}>
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
