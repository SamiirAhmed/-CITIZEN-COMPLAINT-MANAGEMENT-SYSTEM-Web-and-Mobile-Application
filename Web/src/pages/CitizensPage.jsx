import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CitizenForm from '../components/citizens/CitizenForm';
import CitizenTable from '../components/citizens/CitizenTable';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import {
  listCitizens,
  setCitizenStatus,
  updateCitizen,
} from '../services/citizenService';

export default function CitizensPage() {
  const navigate = useNavigate();
  const [citizens, setCitizens] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listCitizens({ search, status });
      setCitizens(result);
    } catch (err) {
      setError(err.message || 'Unable to load citizens.');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const handleToggleStatus = async (citizen) => {
    setBusyId(citizen.id);
    setNotice('');
    try {
      const updated = await setCitizenStatus(citizen.id, !citizen.isActive);
      setCitizens((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(updated.isActive ? 'Citizen activated.' : 'Citizen deactivated.');
    } catch (err) {
      setNotice(err.message || 'Unable to update status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleEditSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const updated = await updateCitizen(editing.id, payload);
      setCitizens((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditing(null);
      setNotice('Citizen updated successfully.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>Citizens</h2>
            <p className="muted">Search, review, and manage registered citizens.</p>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search by name, NIRA, phone, or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {notice ? <div className="alert alert--info">{notice}</div> : null}

        {loading ? (
          <LoadingState message="Loading citizens…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <CitizenTable
            citizens={citizens}
            busyId={busyId}
            onView={(citizen) => navigate(`/citizens/${citizen.id}`)}
            onEdit={setEditing}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </section>

      <Modal
        open={Boolean(editing)}
        title="Edit Citizen"
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <CitizenForm
            initialValues={{
              name: editing.name || '',
              phone: editing.phone || '',
              tell: editing.tell || '',
            }}
            submitting={submitting}
            onCancel={() => setEditing(null)}
            onSubmit={handleEditSubmit}
          />
        ) : null}
      </Modal>
    </div>
  );
}
