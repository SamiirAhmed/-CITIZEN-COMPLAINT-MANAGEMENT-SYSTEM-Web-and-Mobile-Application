import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import AssignOfficerForm from '../components/ob/AssignOfficerForm';
import CreateOBFromComplaintForm from '../components/ob/CreateOBFromComplaintForm';
import OBDetails from '../components/ob/OBDetails';
import OBStatusForm from '../components/ob/OBStatusForm';
import OBTable from '../components/ob/OBTable';
import { OB_STATUSES, getRecordId } from '../constants/domain';
import { useAuth } from '../context/AuthContext';
import { createOBFromComplaint, listComplaints } from '../services/complaintService';
import {
  assignOfficer,
  deleteOBRecord,
  getOBById,
  listOBRecords,
  updateInvestigation,
  updateOBStatus,
} from '../services/obService';
import { listUsers } from '../services/userService';

export default function OBRecordsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [records, setRecords] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [eligibleComplaints, setEligibleComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [investigationTarget, setInvestigationTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listOBRecords({ search, status });
      setRecords(result);
    } catch (err) {
      setError(err.message || 'Unable to load OB records.');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  const loadLookups = useCallback(async () => {
    if (!isAdmin) return;
    const [users, complaints] = await Promise.all([
      listUsers({ role: 'police', status: 'active' }),
      listComplaints({}),
    ]);
    setOfficers(users.filter((item) => item.role === 'police' || item.role === 'admin'));
    setEligibleComplaints(
      complaints.filter((item) =>
        ['Submitted', 'Under Review', 'Verified'].includes(item.status)
      )
    );
  }, [isAdmin]);

  useEffect(() => {
    loadLookups().catch(() => {});
  }, [loadLookups]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const refreshRecord = async (id) => {
    try {
      const updated = await getOBById(id);
      if (updated) {
        setRecords((prev) =>
          prev.map((item) => (getRecordId(item) === getRecordId(updated) ? updated : item))
        );
        if (viewing && getRecordId(viewing) === getRecordId(updated)) {
          setViewing(updated);
        }
      }
    } catch {
      await load();
    }
  };

  const handleCreateOB = async ({ complaintId, citizenSummary }) => {
    setSubmitting(true);
    try {
      await createOBFromComplaint(complaintId, { citizenSummary });
      setCreateOpen(false);
      setNotice('OB record created successfully.');
      await Promise.all([load(), loadLookups()]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = async (record) => {
    try {
      const details = await getOBById(getRecordId(record));
      setViewing(details || record);
    } catch (err) {
      setNotice(err.message || 'Unable to load OB details.');
      setViewing(record);
    }
  };

  const handleAssign = async (officerId) => {
    setSubmitting(true);
    try {
      const id = getRecordId(assigning);
      await assignOfficer(id, officerId);
      setAssigning(null);
      setNotice('Officer assigned successfully.');
      await refreshRecord(id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (payload) => {
    setSubmitting(true);
    try {
      const id = getRecordId(statusTarget);
      await updateOBStatus(id, payload);
      setStatusTarget(null);
      setNotice('OB status updated successfully.');
      await refreshRecord(id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvestigationUpdate = async (payload) => {
    setSubmitting(true);
    try {
      const id = getRecordId(investigationTarget);
      await updateInvestigation(id, payload);
      setInvestigationTarget(null);
      setNotice('Investigation updated successfully.');
      await refreshRecord(id);
    } finally {
      setSubmitting(false);
    }
  };

  const runDelete = async () => {
    if (!confirmTarget) return;
    const id = getRecordId(confirmTarget);
    setBusyId(id);
    setNotice('');
    try {
      await deleteOBRecord(id);
      setRecords((prev) => prev.filter((item) => getRecordId(item) !== id));
      setNotice('OB record deleted successfully.');
      setConfirmTarget(null);
      await loadLookups();
    } catch (err) {
      setNotice(err.message || 'Unable to delete OB record.');
      setConfirmTarget(null);
    } finally {
      setBusyId(null);
    }
  };

  const headerActions = useMemo(() => {
    if (!isAdmin) return null;
    return (
      <div className="action-row">
        <button type="button" className="btn btn--primary" onClick={() => setCreateOpen(true)}>
          Create OB Record
        </button>
      </div>
    );
  }, [isAdmin]);

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>OB Records</h2>
            <p className="muted">Manage OB records linked to complaints.</p>
          </div>
          {headerActions}
        </div>

        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search by OB number, complaint, or citizen"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {OB_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {notice ? <div className="alert alert--info">{notice}</div> : null}

        {loading ? (
          <LoadingState message="Loading OB records…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <OBTable
            records={records}
            busyId={busyId}
            canAssign={isAdmin}
            canDelete={isAdmin}
            canUpdateStatus
            onView={handleView}
            onAssign={setAssigning}
            onUpdateStatus={(record) => {
              if (isAdmin) {
                setStatusTarget(record);
              } else {
                setInvestigationTarget(record);
              }
            }}
            onDelete={setConfirmTarget}
          />
        )}
      </section>

      <Modal
        open={createOpen}
        title="Create OB Record"
        onClose={() => setCreateOpen(false)}
        size="lg"
      >
        <CreateOBFromComplaintForm
          complaints={eligibleComplaints}
          submitting={submitting}
          onCancel={() => setCreateOpen(false)}
          onSubmit={handleCreateOB}
        />
      </Modal>

      <Modal
        open={Boolean(viewing)}
        title="OB Record Details"
        onClose={() => setViewing(null)}
        size="lg"
      >
        <OBDetails record={viewing} />
        {viewing && (isAdmin || user?.role === 'police') ? (
          <div className="form-actions">
            {isAdmin ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setAssigning(viewing);
                }}
              >
                Assign officer
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                if (isAdmin) setStatusTarget(viewing);
                else setInvestigationTarget(viewing);
              }}
            >
              Update status
            </button>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(assigning)}
        title="Assign Officer"
        onClose={() => setAssigning(null)}
        size="md"
      >
        {assigning ? (
          <AssignOfficerForm
            officers={officers}
            initialOfficerId={assigning.assignedOfficer?.id || ''}
            submitting={submitting}
            onCancel={() => setAssigning(null)}
            onSubmit={handleAssign}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(statusTarget)}
        title="Update OB Status"
        onClose={() => setStatusTarget(null)}
        size="md"
      >
        {statusTarget ? (
          <OBStatusForm
            mode="status"
            submitting={submitting}
            onCancel={() => setStatusTarget(null)}
            onSubmit={handleStatusUpdate}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(investigationTarget)}
        title="Update Investigation"
        onClose={() => setInvestigationTarget(null)}
        size="md"
      >
        {investigationTarget ? (
          <OBStatusForm
            mode="investigation"
            submitting={submitting}
            onCancel={() => setInvestigationTarget(null)}
            onSubmit={handleInvestigationUpdate}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete OB Record"
        message={
          confirmTarget ? `Are you sure you want to delete ${confirmTarget.obNumber}?` : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        busy={Boolean(busyId)}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={runDelete}
      />
    </div>
  );
}
