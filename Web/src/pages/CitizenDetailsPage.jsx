import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CitizenDetails from '../components/citizens/CitizenDetails';
import CitizenForm from '../components/citizens/CitizenForm';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import {
  getCitizenById,
  setCitizenStatus,
  updateCitizen,
} from '../services/citizenService';

export default function CitizenDetailsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getCitizenById(id);
      setData(result);
    } catch (err) {
      setError(err.message || 'Unable to load citizen details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEditSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const updated = await updateCitizen(id, payload);
      setData((prev) => ({ ...prev, citizen: updated }));
      setEditing(false);
      setNotice('Citizen updated successfully.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!data?.citizen) return;
    setStatusBusy(true);
    setNotice('');
    try {
      const updated = await setCitizenStatus(id, !data.citizen.isActive);
      setData((prev) => ({ ...prev, citizen: updated }));
      setNotice(updated.isActive ? 'Citizen activated.' : 'Citizen deactivated.');
    } catch (err) {
      setNotice(err.message || 'Unable to update status.');
    } finally {
      setStatusBusy(false);
    }
  };

  if (loading) return <LoadingState message="Loading citizen…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data?.citizen) {
    return <ErrorState title="Citizen not found" message="The requested citizen could not be found." />;
  }

  const citizen = data.citizen;

  return (
    <div className="page-stack">
      <div className="page-actions">
        <Link to="/citizens" className="btn btn--ghost">
          ← Back to citizens
        </Link>
        <div className="action-row">
          <button type="button" className="btn btn--secondary" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button
            type="button"
            className={`btn ${citizen.isActive ? 'btn--danger' : 'btn--success'}`}
            disabled={statusBusy}
            onClick={handleToggleStatus}
          >
            {statusBusy ? 'Updating…' : citizen.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {notice ? <div className="alert alert--info">{notice}</div> : null}

      <CitizenDetails
        citizen={citizen}
        complaints={data.complaints || []}
        obRecords={data.obRecords || []}
      />

      <Modal open={editing} title="Edit Citizen" onClose={() => setEditing(false)}>
        <CitizenForm
          initialValues={{
            name: citizen.name || '',
            phone: citizen.phone || '',
            tell: citizen.tell || '',
          }}
          submitting={submitting}
          onCancel={() => setEditing(false)}
          onSubmit={handleEditSubmit}
        />
      </Modal>
    </div>
  );
}
