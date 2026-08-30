import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import PoliceRegistrationForm from '../components/users/PoliceRegistrationForm';
import UserDetails from '../components/users/UserDetails';
import UserTable from '../components/users/UserTable';
import { useAuth } from '../context/AuthContext';
import {
  listUsers,
  registerStaff,
  setUserStatus,
  updateUser,
  getUserById,
} from '../services/userService';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listUsers({ search, role, status });
      setUsers(result);
    } catch (err) {
      setError(err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [search, role, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const user = await getUserById(id);
        if (!cancelled) setViewing(user);
      } catch {
        if (!cancelled) setNotice('Unable to open the selected user.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleRegister = async (payload) => {
    setSubmitting(true);
    try {
      const result = await registerStaff(payload);
      setUsers((prev) => [result.user, ...prev]);
      setRegisterOpen(false);
      setNotice(
        result.message ||
          'User registered successfully. Share the account email and your organization\'s initial password securely.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const updated = await updateUser(editing.id, payload);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditing(null);
      setNotice('User updated successfully.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = (user) => {
    const active = user.isActive !== false;
    setConfirmTarget({
      user,
      nextActive: !active,
      label: active ? 'deactivate' : 'activate',
      confirmLabel: active ? 'Deactivate' : 'Activate',
      tone: active ? 'danger' : 'success',
    });
  };

  const runStatusChange = async () => {
    if (!confirmTarget) return;
    const { user, nextActive } = confirmTarget;
    setBusyId(user.id);
    setNotice('');
    try {
      const updated = await setUserStatus(user.id, nextActive);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(updated.isActive ? 'User activated.' : 'User deactivated.');
      setConfirmTarget(null);
    } catch (err) {
      setNotice(err.message || 'Unable to update status.');
      setConfirmTarget(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>Users</h2>
            <p className="muted">Manage admin and police staff accounts.</p>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => setRegisterOpen(true)}>
            Add User
          </button>
        </div>

        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search by name, email, phone, NIRA, or badge"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="police">Police</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {notice ? <div className="alert alert--info">{notice}</div> : null}

        {loading ? (
          <LoadingState message="Loading users…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <UserTable
            users={users}
            busyId={busyId}
            currentUserId={currentUser?.id}
            onView={setViewing}
            onEdit={setEditing}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </section>

      <Modal
        open={registerOpen}
        title="Register User"
        onClose={() => setRegisterOpen(false)}
        size="lg"
      >
        <PoliceRegistrationForm
          mode="register"
          submitting={submitting}
          onCancel={() => setRegisterOpen(false)}
          onSubmit={handleRegister}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        title="Edit User"
        onClose={() => setEditing(null)}
        size="lg"
      >
        {editing ? (
          <PoliceRegistrationForm
            mode="edit"
            initialValues={{
              name: editing.name || '',
              phone: editing.phone || '',
              email: editing.email || '',
              badgeNumber: editing.badgeNumber || '',
              station: editing.station || '',
              region: editing.region || '',
              district: editing.district || '',
            }}
            currentImage={editing.profileImage || ''}
            submitting={submitting}
            onCancel={() => setEditing(null)}
            onSubmit={handleEditSubmit}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(viewing)}
        title="User Details"
        onClose={() => setViewing(null)}
        size="lg"
      >
        <UserDetails user={viewing} />
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.confirmLabel || 'Confirm'}
        message={
          confirmTarget
            ? `Are you sure you want to ${confirmTarget.label} ${confirmTarget.user.name}?`
            : ''
        }
        confirmLabel={confirmTarget?.confirmLabel || 'Confirm'}
        cancelLabel="Cancel"
        tone={confirmTarget?.tone || 'danger'}
        busy={Boolean(busyId)}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={runStatusChange}
      />
    </div>
  );
}
