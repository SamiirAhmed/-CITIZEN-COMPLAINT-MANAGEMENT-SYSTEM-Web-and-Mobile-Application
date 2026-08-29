import { useCallback, useEffect, useState } from 'react';
import Modal from '../components/common/Modal';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import PoliceRegistrationForm from '../components/users/PoliceRegistrationForm';
import UserDetails from '../components/users/UserDetails';
import UserTable from '../components/users/UserTable';
import { useAuth } from '../context/AuthContext';
import {
  listUsers,
  registerPolice,
  setUserStatus,
  updateUser,
} from '../services/userService';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
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

  const handleRegister = async (payload) => {
    setSubmitting(true);
    try {
      const created = await registerPolice(payload);
      setUsers((prev) => [created, ...prev]);
      setRegisterOpen(false);
      setNotice('Police user registered successfully.');
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

  const handleToggleStatus = async (user) => {
    setBusyId(user.id);
    setNotice('');
    try {
      const updated = await setUserStatus(user.id, !user.isActive);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(updated.isActive ? 'User activated.' : 'User deactivated.');
    } catch (err) {
      setNotice(err.message || 'Unable to update status.');
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
            Register Police
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
        title="Register Police"
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
              tell: editing.tell || '',
              badgeNumber: editing.badgeNumber || '',
              station: editing.station || '',
            }}
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
      >
        <UserDetails user={viewing} />
      </Modal>
    </div>
  );
}
