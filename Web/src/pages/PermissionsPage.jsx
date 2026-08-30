import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ProfileAvatar from '../components/common/ProfileAvatar';
import {
  getPoliceUsersForPermissions,
  getUserPermissions,
  updateUserPermissions,
} from '../services/permissionService';

const DETAILS_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      fill="currentColor"
      d="M4 6h2v2H4V6zm4 0h12v2H8V6zM4 11h2v2H4v-2zm4 0h12v2H8v-2zM4 16h2v2H4v-2zm4 0h12v2H8v-2z"
    />
  </svg>
);

export default function PermissionsPage() {
  const [searchParams] = useSearchParams();
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [policeUsers, setPoliceUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [modules, setModules] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [expandedModule, setExpandedModule] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      setLoadingUsers(true);
      setError('');
      try {
        const users = await getPoliceUsersForPermissions();
        if (active) {
          setPoliceUsers(users);
          const requested = searchParams.get('userId');
          if (requested && users.some((user) => user.id === requested)) {
            setSelectedUserId(requested);
          }
        }
      } catch (err) {
        if (active) setError(err.message || 'Unable to load police users.');
      } finally {
        if (active) setLoadingUsers(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!selectedUserId) {
      setModules([]);
      setSelectedPermissions([]);
      setExpandedModule('');
      return;
    }

    let active = true;

    (async () => {
      setLoadingPermissions(true);
      setError('');
      setSuccess('');
      try {
        const data = await getUserPermissions(selectedUserId);
        if (!active) return;
        setModules(data.modules || []);
        setSelectedPermissions(data.permissions || []);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load user permissions.');
      } finally {
        if (active) setLoadingPermissions(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedUserId]);

  const selectedUser = useMemo(
    () => policeUsers.find((user) => user.id === selectedUserId) || null,
    [policeUsers, selectedUserId]
  );

  const togglePermission = (moduleKey) => {
    if (moduleKey === 'profile') return;

    setSelectedPermissions((current) => {
      if (current.includes(moduleKey)) {
        return current.filter((key) => key !== moduleKey);
      }
      return [...current, moduleKey];
    });
    setSuccess('');
  };

  const handleSave = async () => {
    if (!selectedUserId) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data = await updateUserPermissions(selectedUserId, selectedPermissions);
      setSelectedPermissions(data?.permissions || selectedPermissions);
      setSuccess(
        `Permissions saved. ${selectedUser?.name || 'Police user'} will see only the selected menus after login/refresh.`
      );
    } catch (err) {
      setError(err.message || 'Unable to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingUsers) {
    return <LoadingState message="Loading police users…" />;
  }

  if (error && !policeUsers.length) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="page-stack">
      <section className="access-hero panel">
        <div className="access-hero__copy">
          <p className="settings-hub__eyebrow">Security</p>
          <h1>User Access Control</h1>
          <p className="muted">
            Select a police user and choose which sidebar menus they can see in SPO. Admin accounts
            always retain full access.
          </p>
        </div>
      </section>

      <section className="panel access-panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>Access Control Panel</h2>
            <p className="muted">Assign menu permissions per police officer.</p>
          </div>
          {selectedUserId ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSave}
              disabled={saving || loadingPermissions}
            >
              {saving ? 'Saving…' : 'Save Permissions'}
            </button>
          ) : null}
        </div>

        <div className="access-select-card">
          <label className="field">
            <span>Select User</span>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            >
              <option value="">Select User</option>
              {policeUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                  {user.badgeNumber ? ` (${user.badgeNumber})` : ''}
                </option>
              ))}
            </select>
          </label>

          {selectedUser ? (
            <div className="access-user-card">
              <ProfileAvatar
                name={selectedUser.name}
                src={selectedUser.profileImage}
                size={56}
                className="profile-avatar--ring"
              />
              <div className="access-user-card__meta">
                <strong>{selectedUser.name}</strong>
                <span>{selectedUser.email}</span>
                <span className="muted">
                  {[selectedUser.badgeNumber, selectedUser.station].filter(Boolean).join(' · ') ||
                    'No badge / station'}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {!policeUsers.length ? (
          <EmptyState
            title="No police users found"
            message="Register a police user under Settings → Users first."
          />
        ) : null}

        {error ? <div className="alert alert--error">{error}</div> : null}
        {success ? <div className="alert alert--success">{success}</div> : null}

        {!selectedUserId ? (
          <EmptyState
            title="Select a police user"
            message="Choose a user above to view and assign sidebar permissions."
          />
        ) : loadingPermissions ? (
          <LoadingState message="Loading permissions…" />
        ) : (
          <div className="permission-list">
            {modules.map((module) => {
              const checked = selectedPermissions.includes(module.key);
              const locked = module.key === 'profile';
              const expanded = expandedModule === module.key;

              return (
                <div
                  key={module.key}
                  className={`permission-row ${checked ? 'permission-row--on' : ''} ${
                    locked ? 'permission-row--locked' : ''
                  }`}
                >
                  <div className="permission-row__main">
                    <label className="permission-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked}
                        onChange={() => togglePermission(module.key)}
                      />
                      <span>{module.label}</span>
                      {locked ? <em className="permission-chip">Always on</em> : null}
                      {!locked && checked ? (
                        <em className="permission-chip permission-chip--on">Enabled</em>
                      ) : null}
                    </label>
                    <button
                      type="button"
                      className="permission-details-btn"
                      title="Module details"
                      onClick={() => setExpandedModule(expanded ? '' : module.key)}
                    >
                      {DETAILS_ICON}
                    </button>
                  </div>
                  {expanded ? (
                    <div className="permission-row__details">
                      <p>{module.description}</p>
                      <p className="muted">
                        {locked
                          ? 'Profile remains enabled so the officer can always open the portal.'
                          : checked
                            ? 'This menu will appear in the police sidebar.'
                            : 'This menu will be hidden from the police sidebar.'}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
