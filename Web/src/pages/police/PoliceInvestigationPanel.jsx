import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import TablePager from '../../components/common/TablePager';
import OBDetails from '../../components/ob/OBDetails';
import OBStatusForm from '../../components/ob/OBStatusForm';
import { OB_STATUSES } from '../../constants/domain';
import {
  deleteOBRecord,
  getStaffOBById,
  listStaffOBRecords,
  updateInvestigation,
} from '../../services/obService';
import { matchesOBSearch, paginateRecords, sortRecords } from './policeFormat';
import PoliceOBTable from './PoliceOBTable';
import StartInvestigationForm from './StartInvestigationForm';

const STARTABLE_STATUSES = ['Assigned', 'Opened', 'Reopened'];
const PAGE_SIZE = 10;

export default function PoliceInvestigationPanel() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [status, setStatus] = useState('');
  const [sortKey, setSortKey] = useState('invDate');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRecords(await listStaffOBRecords());
    } catch (err) {
      setError(err.message || 'Unable to load investigations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const investigations = useMemo(
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
    const sorted = sortRecords(investigations, sortKey, sortDir);
    return paginateRecords(sorted, page, PAGE_SIZE);
  }, [investigations, sortKey, sortDir, page]);

  const handleSort = (column) => {
    if (sortKey === column) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(column);
    setSortDir('asc');
  };

  const startable = useMemo(
    () => records.filter((item) => STARTABLE_STATUSES.includes(item.status)),
    [records]
  );

  const handleStart = async ({ id, note }) => {
    setSubmitting(true);
    try {
      await updateInvestigation(id, { action: 'start', note });
      setCreateOpen(false);
      setNotice('Investigation started.');
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
      setError(err.message || 'Unable to load investigation.');
      setViewing(record);
    }
  };

  const handleUpdate = async ({ action, note, citizenSummary }) => {
    setSubmitting(true);
    try {
      await updateInvestigation(editing.id, { action, note, citizenSummary });
      setEditing(null);
      setNotice('Investigation updated.');
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
      setNotice('Investigation deleted.');
      await load();
    } catch (err) {
      setError(err.message || 'Unable to delete investigation.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="panel">
      <div className="panel__header panel__header--spread">
        <div>
          <h2>Investigations</h2>
          <p className="muted">Active investigations on OB records assigned to you.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setCreateOpen(true)}>
          + Add Investigation
        </button>
      </div>

      <div className="toolbar">
        <input
          className="toolbar__search"
          type="search"
          placeholder="Search investigations"
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
        <LoadingState message="Loading investigations…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <PoliceOBTable
            variant="investigation"
            records={paged.rows}
            busyId={busyId}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onView={handleView}
            onEdit={setEditing}
            onDelete={setDeleting}
            emptyTitle="No investigations"
            emptyMessage="Start an investigation on an assigned OB record."
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

      <Modal
        open={createOpen}
        title="Add Investigation"
        onClose={() => setCreateOpen(false)}
        size="lg"
      >
        {startable.length ? (
          <StartInvestigationForm
            records={startable}
            submitting={submitting}
            onCancel={() => setCreateOpen(false)}
            onSubmit={handleStart}
          />
        ) : (
          <p className="muted">
            There are no assigned OB records ready to investigate. Add an OB record first.
          </p>
        )}
      </Modal>

      <Modal
        open={Boolean(viewing)}
        title={viewing?.obNumber || 'Investigation'}
        onClose={() => setViewing(null)}
        size="lg"
      >
        <OBDetails record={viewing} />
      </Modal>

      <Modal
        open={Boolean(editing)}
        title={editing ? `Update ${editing.obNumber}` : 'Edit Investigation'}
        onClose={() => setEditing(null)}
        size="lg"
      >
        <OBStatusForm
          mode="investigation"
          submitting={submitting}
          onCancel={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete investigation"
        message={
          deleting
            ? `Delete the investigation for ${deleting.obNumber}? This removes the OB record.`
            : 'Delete this investigation?'
        }
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
