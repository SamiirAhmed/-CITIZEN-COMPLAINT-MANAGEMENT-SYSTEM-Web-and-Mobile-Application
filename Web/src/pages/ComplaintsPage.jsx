import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ComplaintDetails from '../components/complaints/ComplaintDetails';
import ComplaintForm from '../components/complaints/ComplaintForm';
import ComplaintTable from '../components/complaints/ComplaintTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import { COMPLAINT_STATUSES, getRecordId } from '../constants/domain';
import { listCategories } from '../services/categoryService';
import { listCitizens } from '../services/citizenService';
import {
  createComplaint,
  createOBFromComplaint,
  deleteComplaint,
  getComplaintById,
  listComplaints,
  updateComplaint,
} from '../services/complaintService';

export default function ComplaintsPage() {
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewLinkedOB, setViewLinkedOB] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const loadLookups = useCallback(async () => {
    const [citizenResult, categoryResult] = await Promise.all([
      listCitizens({ status: 'active' }),
      listCategories({ status: 'active' }),
    ]);
    setCitizens(citizenResult);
    setCategories(categoryResult);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listComplaints({ search, status, category });
      setComplaints(result);
    } catch (err) {
      setError(err.message || 'Unable to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [search, status, category]);

  useEffect(() => {
    loadLookups().catch(() => {});
  }, [loadLookups]);

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
        const details = await getComplaintById(id);
        if (!cancelled) {
          setViewing(details?.complaint || { id });
          setViewLinkedOB(details?.ob || null);
        }
      } catch {
        if (!cancelled) setNotice('Unable to open the selected complaint.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      const created = await createComplaint(payload);
      setComplaints((prev) => [created, ...prev]);
      setCreateOpen(false);
      setNotice('Complaint created successfully.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const updated = await updateComplaint(getRecordId(editing), payload);
      setComplaints((prev) =>
        prev.map((item) => (getRecordId(item) === getRecordId(updated) ? updated : item))
      );
      setEditing(null);
      setNotice('Complaint updated successfully.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = async (complaint) => {
    try {
      const details = await getComplaintById(getRecordId(complaint));
      setViewing(details?.complaint || complaint);
      setViewLinkedOB(details?.ob || null);
    } catch (err) {
      setNotice(err.message || 'Unable to load complaint details.');
      setViewing(complaint);
      setViewLinkedOB(null);
    }
  };

  const handleCreateOB = async (complaint) => {
    const id = getRecordId(complaint);
    setBusyId(id);
    setNotice('');
    try {
      await createOBFromComplaint(id, {
        citizenSummary: 'Occurrence Book opened for this complaint.',
      });
      setNotice(`OB created for ${complaint.complaintNumber}.`);
      await load();
    } catch (err) {
      setNotice(err.message || 'Unable to create OB.');
    } finally {
      setBusyId(null);
    }
  };

  const runDelete = async () => {
    if (!confirmTarget) return;
    const id = getRecordId(confirmTarget);
    setBusyId(id);
    setNotice('');
    try {
      await deleteComplaint(id);
      setComplaints((prev) => prev.filter((item) => getRecordId(item) !== id));
      setNotice('Complaint deleted successfully.');
      setConfirmTarget(null);
    } catch (err) {
      setNotice(err.message || 'Unable to delete complaint.');
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
            <h2>Complaints</h2>
            <p className="muted">Review, create, and manage citizen complaints.</p>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => setCreateOpen(true)}>
            Create Complaint
          </button>
        </div>

        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search by number, citizen, category, or location"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id || item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {COMPLAINT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {notice ? <div className="alert alert--info">{notice}</div> : null}

        {loading ? (
          <LoadingState message="Loading complaints…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <ComplaintTable
            complaints={complaints}
            busyId={busyId}
            onView={handleView}
            onEdit={setEditing}
            onDelete={setConfirmTarget}
            onCreateOB={handleCreateOB}
          />
        )}
      </section>

      <Modal
        open={createOpen}
        title="Create Complaint"
        onClose={() => setCreateOpen(false)}
        size="lg"
      >
        <ComplaintForm
          mode="create"
          citizens={citizens}
          categories={categories}
          submitting={submitting}
          onCancel={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        title="Edit Complaint"
        onClose={() => setEditing(null)}
        size="lg"
      >
        {editing ? (
          <ComplaintForm
            mode="edit"
            initialValues={{
              citizenId: editing.citizen?.id || '',
              category: editing.category || '',
              description: editing.description || '',
              incidentDate: editing.incidentDate || '',
              location: editing.location || '',
              relatedInformation: editing.relatedInformation || '',
              evidenceNotes: editing.evidenceNotes || '',
              status: editing.status || 'Submitted',
              note: '',
            }}
            citizens={citizens}
            categories={categories}
            submitting={submitting}
            onCancel={() => setEditing(null)}
            onSubmit={handleEditSubmit}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(viewing)}
        title="Complaint Details"
        onClose={() => {
          setViewing(null);
          setViewLinkedOB(null);
        }}
        size="lg"
      >
        <ComplaintDetails complaint={viewing} linkedOB={viewLinkedOB} />
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete Complaint"
        message={
          confirmTarget
            ? `Are you sure you want to delete ${confirmTarget.complaintNumber}? Linked OB records will also be removed.`
            : ''
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
