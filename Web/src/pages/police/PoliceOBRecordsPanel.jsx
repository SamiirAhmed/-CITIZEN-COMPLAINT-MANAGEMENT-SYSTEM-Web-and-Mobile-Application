import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import TablePager from '../../components/common/TablePager';
import CreateOBFromComplaintForm from '../../components/ob/CreateOBFromComplaintForm';
import OBDetails from '../../components/ob/OBDetails';
import { OB_STATUSES } from '../../constants/domain';
import { createOBFromComplaint, listComplaints } from '../../services/complaintService';
import {
  deleteOBRecord,
  getStaffOBById,
  listStaffOBRecords,
  updateInvestigation,
} from '../../services/obService';
import { matchesOBSearch, paginateRecords, sortRecords } from './policeFormat';
import PoliceEditOBForm from './PoliceEditOBForm';
import PoliceOBTable from './PoliceOBTable';

const PAGE_SIZE = 10;

export default function PoliceOBRecordsPanel({ initialSearch = '' }) {
  const [records, setRecords] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextRecords, nextComplaints] = await Promise.all([
        listStaffOBRecords(),
        listComplaints({}),
      ]);
      setRecords(nextRecords);
      setComplaints(
        nextComplaints.filter((item) =>
          ['Submitted', 'Under Review', 'Verified'].includes(item.status)
        )
      );
    } catch (err) {
      setError(err.message || 'Unable to load OB records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      records.filter((item) => {
        if (status && item.status !== status) return false;
        return matchesOBSearch(item, search);
      }),
    [records, search, status]
  );

  useEffect(() => {
    setPage(1);
  }, [search, status, sortKey, sortDir]);

  const paged = useMemo(() => {
    const sorted = sortRecords(filtered, sortKey, sortDir);
    return paginateRecords(sorted, page, PAGE_SIZE);
  }, [filtered, sortKey, sortDir, page]);

  const handleSort = (column) => {
    if (sortKey === column) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(column);
    setSortDir('asc');
  };

  const handleCreate = async ({ complaintId, citizenSummary }) => {
    setSubmitting(true);
    try {
      await createOBFromComplaint(complaintId, { citizenSummary });
      setCreateOpen(false);
      setNotice('OB record created successfully.');
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = async (record) => {
    try {
      const details = await getStaffOBById(record.id);
      setViewing(details || record);
    } catch (err) {
      setError(err.message || 'Unable to load OB details.');
      setViewing(record);
    }
  };

  const handleEdit = async ({ citizenSummary, note }) => {
    setSubmitting(true);
    try {
      await updateInvestigation(editing.id, {
        action: 'edit',
        citizenSummary,
        note,
      });
      setEditing(null);
      setNotice('OB record updated successfully.');
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await deleteOBRecord(deleting.id);
      setDeleting(null);
      setNotice('OB record deleted successfully.');
      await load();
    } catch (err) {
      setError(err.message || 'Unable to delete OB record.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="panel">
      <div className="panel__header panel__header--spread">
        <div>
          <h2>OB Records</h2>
          <p className="muted">Occurrence book records assigned to you.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setCreateOpen(true)}>
          + Add OB Record
        </button>
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

      {notice ? <div className="alert alert--success">{notice}</div> : null}

      {loading ? (
        <LoadingState message="Loading OB records…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <PoliceOBTable
            records={paged.rows}
            busyId={busyId}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onView={handleView}
            onEdit={setEditing}
            onDelete={setDeleting}
            emptyTitle="No assigned OB records"
            emptyMessage="Add an OB record from an eligible complaint, or wait for an assignment."
          />
          <TablePager
            page={paged.page}
            pageCount={paged.pageCount}
            total={paged.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal open={createOpen} title="Add OB Record" onClose={() => setCreateOpen(false)} size="lg">
        <CreateOBFromComplaintForm
          complaints={complaints}
          submitting={submitting}
          onCancel={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      </Modal>

      <Modal
        open={Boolean(viewing)}
        title={viewing?.obNumber || 'OB Details'}
        onClose={() => setViewing(null)}
        size="lg"
      >
        <OBDetails record={viewing} />
      </Modal>

      <Modal
        open={Boolean(editing)}
        title={editing ? `Edit ${editing.obNumber}` : 'Edit OB Record'}
        onClose={() => setEditing(null)}
        size="lg"
      >
        <PoliceEditOBForm
          record={editing}
          submitting={submitting}
          onCancel={() => setEditing(null)}
          onSubmit={handleEdit}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete OB record"
        message={
          deleting
            ? `Delete ${deleting.obNumber}? This cannot be undone.`
            : 'Delete this OB record?'
        }
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
