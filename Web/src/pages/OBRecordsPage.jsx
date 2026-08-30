<<<<<<< HEAD
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardSummaryCard from '../components/dashboard/DashboardSummaryCard';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import OccurrenceDetails from '../components/occurrences/OccurrenceDetails';
import OccurrenceForm from '../components/occurrences/OccurrenceForm';
import OccurrenceTable from '../components/occurrences/OccurrenceTable';
import { useAuth } from '../context/AuthContext';
import {
  assignOccurrence,
  changeOccurrenceStatus,
  closeOccurrence,
  createOccurrence,
  exportOccurrencesCsv,
  getOccurrenceById,
  getOccurrenceMeta,
  getOccurrenceStats,
  listOccurrences,
  reopenOccurrence,
  updateOccurrence,
} from '../services/occurrenceService';
import { EMPTY_OCCURRENCE_FORM } from '../validation/occurrenceValidation';

const EMPTY_FILTERS = {
  search: '',
  status: '',
  category: '',
  priority: '',
  station: '',
  district: '',
  assignedOfficer: '',
  dateFrom: '',
  dateTo: '',
};
=======
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
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9

export default function OBRecordsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
<<<<<<< HEAD

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState(null);
  const [meta, setMeta] = useState({ statuses: [], priorities: [], categories: [] });
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const [officerId, setOfficerId] = useState('');
  const [statusValue, setStatusValue] = useState('');
  const [actionNote, setActionNote] = useState('');

  const loadMeta = useCallback(async () => {
    try {
      const metaResult = await getOccurrenceMeta();
      setMeta(metaResult);
      setOfficers(metaResult.officers || []);
    } catch {
      // meta is non-blocking
    }
  }, []);
=======
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
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
<<<<<<< HEAD
      const [listResult, statsResult] = await Promise.all([
        listOccurrences({ ...filters, page, limit: 25 }),
        getOccurrenceStats(),
      ]);
      setRecords(listResult.records);
      setPagination(listResult.pagination);
      setStats(statsResult?.summary || null);
    } catch (err) {
      setError(err.message || 'Unable to load occurrences.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    const { viewId, editId, openCreate } = location.state || {};
    if (openCreate) {
      setCreateFormKey((key) => key + 1);
      setCreateOpen(true);
    }
    if (viewId) {
      getOccurrenceById(viewId)
        .then((record) => setViewing(record))
        .catch(() => {});
    }
    if (editId) {
      getOccurrenceById(editId)
        .then((record) => setEditing(record))
        .catch(() => {});
    }
  }, [location.state]);
=======
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
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

<<<<<<< HEAD
  const setFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  };

  const refreshViewing = async (id) => {
    if (!viewing || viewing.id !== id) return;
    try {
      const fresh = await getOccurrenceById(id);
      setViewing(fresh);
    } catch {
      // ignore
    }
  };

  const handleCreate = async (payload) => {
    setSubmitting(true);
    setNotice('');
    try {
      console.info('[OB] handleCreate calling createOccurrence...');
      const created = await createOccurrence(payload);
      console.info('[OB] createOccurrence response:', created);

      if (!created?.id) {
        throw new Error('Server did not return the saved occurrence.');
      }

      // Clear filters so the new record is visible in the list immediately
      setFilters(EMPTY_FILTERS);
      setPage(1);
      setNotice('Data has been saved successfully.');
      setRecords((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: (prev.total || 0) + 1,
      }));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              total: (prev.total || 0) + 1,
              open: (prev.open || 0) + 1,
            }
          : prev
      );

      window.setTimeout(() => {
        setCreateOpen(false);
        setCreateFormKey((key) => key + 1);
      }, 1800);

      return created;
    } catch (err) {
      console.error('[OB] Failed to create occurrence:', err);
      setNotice(err.message || 'Failed to save occurrence. Please try again.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (payload) => {
    setSubmitting(true);
    try {
      const updated = await updateOccurrence(editing.id, payload);
      setEditing(null);
      setNotice('Occurrence updated successfully.');
      setRecords((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      await refreshViewing(updated.id);
      await load();
=======
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
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9
    } finally {
      setSubmitting(false);
    }
  };

<<<<<<< HEAD
  const handleAssign = async () => {
    if (!officerId) {
      setNotice('Select an officer to assign.');
      return;
    }
    setBusyId(assigning.id);
    try {
      const updated = await assignOccurrence(assigning.id, officerId);
      setAssigning(null);
      setOfficerId('');
      setNotice(`Assigned to ${updated.assignedOfficer?.name || 'officer'}.`);
      await load();
      await refreshViewing(updated.id);
    } catch (err) {
      setNotice(err.message || 'Unable to assign officer.');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async () => {
    if (!statusValue) {
      setNotice('Select a status.');
      return;
    }
    setBusyId(statusTarget.id);
    try {
      await changeOccurrenceStatus(statusTarget.id, statusValue, actionNote);
      setStatusTarget(null);
      setStatusValue('');
      setActionNote('');
      setNotice('Status updated.');
      await load();
    } catch (err) {
      setNotice(err.message || 'Unable to update status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleClose = async () => {
    setBusyId(closeTarget.id);
    try {
      await closeOccurrence(closeTarget.id, actionNote);
      setCloseTarget(null);
      setActionNote('');
      setNotice('Occurrence closed.');
      await load();
    } catch (err) {
      setNotice(err.message || 'Unable to close occurrence.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReopen = async (record) => {
    setBusyId(record.id);
    try {
      await reopenOccurrence(record.id, 'Occurrence reopened by admin.');
      setNotice('Occurrence reopened.');
      await load();
    } catch (err) {
      setNotice(err.message || 'Unable to reopen occurrence.');
    } finally {
      setBusyId(null);
    }
  };

  const handleView = async (record) => {
    try {
      const fresh = await getOccurrenceById(record.id);
      setViewing(fresh);
    } catch (err) {
      setNotice(err.message || 'Unable to load occurrence details.');
    }
  };

  const handleExport = async () => {
    try {
      await exportOccurrencesCsv(filters);
      setNotice('CSV export downloaded.');
    } catch (err) {
      setNotice(err.message || 'Export failed.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = stats || {};
=======
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
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
<<<<<<< HEAD
            <h2>Police Occurrence Book</h2>
            <p className="muted">
              Create, search, assign, and track police occurrence records.
            </p>
          </div>
          <div className="action-row">
            <button type="button" className="btn btn--secondary" onClick={handleExport}>
              Export CSV
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setCreateFormKey((key) => key + 1);
                setCreateOpen(true);
                setNotice('');
              }}
            >
              New Occurrence
            </button>
          </div>
        </div>

        <section className="summary-grid summary-grid--six">
          <DashboardSummaryCard label="Total Occurrences" value={summary.total} tone="primary" />
          <DashboardSummaryCard label="Open" value={summary.open} tone="warning" />
          <DashboardSummaryCard
            label="Under Investigation"
            value={summary.underInvestigation}
            tone="info"
          />
          <DashboardSummaryCard label="Pending" value={summary.pending} tone="warning" />
          <DashboardSummaryCard label="Resolved" value={summary.resolved} tone="success" />
          <DashboardSummaryCard label="Closed" value={summary.closed} tone="primary" />
        </section>
      </section>

      <section className="panel">
        <div className="toolbar toolbar--filters">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search OB number, complainant, subject, location, officer…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
          <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {(meta.statuses || []).map((item) => (
=======
            <h2>OB Records</h2>
            <p className="muted">Manage occurrence books linked to complaints.</p>
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
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
<<<<<<< HEAD
          <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {(meta.categories || []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)}>
            <option value="">All priorities</option>
            {(meta.priorities || []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Station"
            value={filters.station}
            onChange={(e) => setFilter('station', e.target.value)}
          />
          <input
            type="text"
            placeholder="District"
            value={filters.district}
            onChange={(e) => setFilter('district', e.target.value)}
          />
          <select
            value={filters.assignedOfficer}
            onChange={(e) => setFilter('assignedOfficer', e.target.value)}
          >
            <option value="">All officers</option>
            {officers.map((officer) => (
              <option key={officer.id} value={officer.id}>
                {officer.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
            aria-label="From date"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
            aria-label="To date"
          />
          <button type="button" className="btn btn--ghost" onClick={clearFilters}>
            Clear filters
          </button>
        </div>

        {notice ? (
          <div
            className={`alert ${
              notice.toLowerCase().includes('fail') ||
              notice.toLowerCase().includes('unable') ||
              notice.toLowerCase().includes('select')
                ? 'alert--error'
                : 'alert--success'
            }`}
          >
            {notice}
          </div>
        ) : null}

        {loading ? (
          <LoadingState message="Loading occurrence records…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <>
            <OccurrenceTable
              records={records}
              isAdmin={isAdmin}
              busyId={busyId}
              onView={handleView}
              onEdit={setEditing}
              onAssign={(record) => {
                setAssigning(record);
                setOfficerId(record.assignedOfficer?.id || '');
              }}
              onChangeStatus={(record) => {
                setStatusTarget(record);
                setStatusValue(record.status);
                setActionNote('');
              }}
              onClose={(record) => {
                setCloseTarget(record);
                setActionNote('');
              }}
              onReopen={handleReopen}
            />

            <div className="pagination-row">
              <p className="muted">
                Showing {records.length} of {pagination.total} · Page {pagination.page} of{' '}
                {pagination.pages}
              </p>
              <div className="action-row">
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
=======
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
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9
        )}
      </section>

      <Modal
        open={createOpen}
<<<<<<< HEAD
        title="New Occurrence"
        size="lg"
        onClose={() => {
          if (!submitting) setCreateOpen(false);
        }}
      >
        <OccurrenceForm
          key={`create-${createFormKey}`}
          formKey={createFormKey}
          initialValues={EMPTY_OCCURRENCE_FORM}
          categories={meta.categories}
          priorities={meta.priorities}
          officers={officers}
          submitting={submitting}
          submitLabel="Create"
          resetOnSuccess
          onCancel={() => {
            if (!submitting) setCreateOpen(false);
          }}
          onSubmit={handleCreate}
=======
        title="Create OB Record"
        onClose={() => setCreateOpen(false)}
        size="lg"
      >
        <CreateOBFromComplaintForm
          complaints={eligibleComplaints}
          submitting={submitting}
          onCancel={() => setCreateOpen(false)}
          onSubmit={handleCreateOB}
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9
        />
      </Modal>

      <Modal
<<<<<<< HEAD
        open={Boolean(editing)}
        title={`Edit ${editing?.obNumber || 'Occurrence'}`}
        size="lg"
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <OccurrenceForm
            initialValues={editing}
            categories={meta.categories}
            priorities={meta.priorities}
            officers={officers}
            submitting={submitting}
            submitLabel="Save Changes"
            onCancel={() => setEditing(null)}
            onSubmit={handleEdit}
=======
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
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9
          />
        ) : null}
      </Modal>

      <Modal
<<<<<<< HEAD
        open={Boolean(viewing)}
        title={viewing ? `Occurrence ${viewing.obNumber}` : 'Occurrence Details'}
        size="lg"
        onClose={() => setViewing(null)}
        footer={
          <div className="action-row">
            <button type="button" className="btn btn--secondary" onClick={handlePrint}>
              Print
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setViewing(null)}>
              Close
            </button>
          </div>
        }
      >
        <OccurrenceDetails record={viewing} />
      </Modal>

      <Modal
        open={Boolean(assigning)}
        title={`Assign officer — ${assigning?.obNumber || ''}`}
        onClose={() => setAssigning(null)}
      >
        <div className="form-grid">
          <label className="field field--full">
            <span>Police officer</span>
            <select value={officerId} onChange={(e) => setOfficerId(e.target.value)}>
              <option value="">Select officer</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.name}
                  {officer.badgeNumber ? ` (${officer.badgeNumber})` : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="form-actions field--full">
            <button type="button" className="btn btn--ghost" onClick={() => setAssigning(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={handleAssign}>
              Assign
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(statusTarget)}
        title={`Change status — ${statusTarget?.obNumber || ''}`}
        onClose={() => setStatusTarget(null)}
      >
        <div className="form-grid">
          <label className="field field--full">
            <span>Status</span>
            <select value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
              {(meta.statuses || [])
                .filter((s) =>
                  isAdmin ? true : !['Closed', 'Resolved', 'Reopened'].includes(s)
                )
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
          </label>
          <label className="field field--full">
            <span>Note</span>
            <textarea rows={3} value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
          </label>
          <div className="form-actions field--full">
            <button type="button" className="btn btn--ghost" onClick={() => setStatusTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={handleStatusChange}>
              Update status
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(closeTarget)}
        title={`Close occurrence — ${closeTarget?.obNumber || ''}`}
        onClose={() => setCloseTarget(null)}
      >
        <div className="form-grid">
          <label className="field field--full">
            <span>Closure notes</span>
            <textarea rows={3} value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
          </label>
          <div className="form-actions field--full">
            <button type="button" className="btn btn--ghost" onClick={() => setCloseTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn--danger" onClick={handleClose}>
              Close occurrence
            </button>
          </div>
        </div>
      </Modal>
=======
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
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9
    </div>
  );
}
