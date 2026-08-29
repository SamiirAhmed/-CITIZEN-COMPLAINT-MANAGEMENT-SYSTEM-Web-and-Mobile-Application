import { Link } from 'react-router-dom';

export default function SettingsPage() {
  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Settings</h2>
            <p className="muted">Manage staff accounts and access controls for the SPO admin portal.</p>
          </div>
        </div>

        <div className="settings-links">
          <Link to="/settings/users" className="settings-card">
            <h3>Users</h3>
            <p>View staff accounts and register police officers.</p>
          </Link>
          <Link to="/settings/permissions" className="settings-card">
            <h3>Permissions</h3>
            <p>Review permission module availability for role-based access.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
