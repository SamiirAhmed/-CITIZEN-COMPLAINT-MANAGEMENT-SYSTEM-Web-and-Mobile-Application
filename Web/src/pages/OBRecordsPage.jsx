import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import { PageSectionHeader } from '../components/common/PremiumTabs';
import AssignOfficerForm from '../components/ob/AssignOfficerForm';
import ClosedOBTable from '../components/ob/ClosedOBTable';
import CreateOBFromComplaintForm from '../components/ob/CreateOBFromComplaintForm';
import OBDetails from '../components/ob/OBDetails';
import OBStatusForm from '../components/ob/OBStatusForm';
import OBTable from '../components/ob/OBTable';
import { OB_STATUSES, formatDateTime, getRecordId, canAssignOB, canReopenOB, canUpdateOBWorkflow } from '../constants/domain';
import { useAuth } from '../context/AuthContext';
import { createOBFromComplaint, listComplaints } from '../services/complaintService';
import {
  assignOfficer,
  deleteOBRecord,
  getOBById,
  listOBRecords,
  reopenClosedOB,
  updateInvestigation,
  updateOBStatus,
} from '../services/obService';
import { listUsers } from '../services/userService';

const TAB_RECORDS = 'records';
const TAB_REOPEN = 'reopen';

function dedupeRecords(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    const id = getRecordId(row);
    if (!id) return;
    map.set(id, row);
  });
  return Array.from(map.values());
}

function onlyActiveRecords(rows = []) {
  return dedupeRecords(rows).filter((item) => item.status && item.status !== 'Closed');
}

function onlyClosedRecords(rows = []) {
  return dedupeRecords(rows).filter((item) => item.status === 'Closed');
}

export default function OBRecordsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';
  const [records, setRecords] = useState([]);
  const [closedRecords, setClosedRecords] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [eligibleComplaints, setEligibleComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const [closedSearch, setClosedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [closedLoading, setClosedLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [investigationTarget, setInvestigationTarget] = useState(null);
  const [reopening, setReopening] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeTone, setNoticeTone] = useState('info');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const activeTab = useMemo(() => {
    if (!isAdmin) return TAB_RECORDS;
    return searchParams.get('tab') === TAB_REOPEN ? TAB_REOPEN : TAB_RECORDS;
  }, [isAdmin, searchParams]);

  const obTabs = useMemo(() => {
    const tabs = [{ id: TAB_RECORDS, label: 'OBE Records' }];
    if (isAdmin) {
      tabs.push({ id: TAB_REOPEN, label: 'Re-open OBE' });
    }
    return tabs;
  }, [isAdmin]);

  const setActiveTab = (tabId) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tabId === TAB_REOPEN && isAdmin) {
          next.set('tab', TAB_REOPEN);
        } else {
          next.delete('tab');
        }
        next.delete('id');
        return next;
      },
      { replace: true }
    );
  };

  const clearViewingModal = useCallback(() => {
    setViewing(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('id');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const loadActive = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Never show Closed in the active OBE Records workflow.
      if (status === 'Closed') {
        setRecords([]);
      } else {
        const result = await listOBRecords({ search, status });
        setRecords(onlyActiveRecords(result));
      }
    } catch (err) {
      setError(err.message || 'Unable to load OB records.');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  const loadClosed = useCallback(async () => {
    if (!isAdmin) {
      setClosedRecords([]);
      setClosedLoading(false);
      return;
    }
    setClosedLoading(true);
    try {
      const result = await listOBRecords({
        search: closedSearch,
        status: 'Closed',
      });
      // Re-open tab: Closed only — never Resolved / Under Investigation / etc.
      setClosedRecords(onlyClosedRecords(result));
    } catch {
      setClosedRecords([]);
    } finally {
      setClosedLoading(false);
    }
  }, [closedSearch, isAdmin]);

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
      loadActive();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadActive]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClosed();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadClosed]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) return undefined;
    let cancelled = false;
    setViewing((prev) =>
      prev && getRecordId(prev) === id ? { ...prev, _loading: true } : { id, _loading: true }
    );
    (async () => {
      try {
        const details = await getOBById(id);
        if (!cancelled) setViewing(details || { id });
      } catch {
        if (!cancelled) {
          setNoticeTone('error');
          setNotice('Unable to open the selected OB record.');
          setViewing(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const openViewingModal = useCallback(
    (record) => {
      const id = getRecordId(record);
      if (!id) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('id', id);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const openReopenDialog = useCallback((record) => {
    clearViewingModal();
    setAssigning(null);
    setStatusTarget(null);
    setInvestigationTarget(null);
    setReopening(record);
  }, [clearViewingModal]);

  const refreshAfterChange = async (id) => {
    await Promise.all([loadActive(), loadClosed()]);
    try {
      const updated = await getOBById(id);
      if (updated && viewing && getRecordId(viewing) === getRecordId(updated)) {
        setViewing(updated);
      }
    } catch {
      // ignore detail refresh errors
    }
  };

  const handleCreateOB = async ({ complaintId, citizenSummary }) => {
    setSubmitting(true);
    try {
      await createOBFromComplaint(complaintId, { citizenSummary });
      setCreateOpen(false);
      setNotice('OB record created successfully.');
      await Promise.all([loadActive(), loadClosed(), loadLookups()]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (record) => {
    openViewingModal(record);
  };

  const handleAssign = async (officerId) => {
    setSubmitting(true);
    try {
      const id = getRecordId(assigning);
      const updated = await assignOfficer(id, officerId);
      setAssigning(null);
      setNoticeTone('success');
      setNotice('Officer assigned successfully to the same OBE record.');
      // Keep the SAME record in active list — never create a duplicate row.
      if (updated) {
        setRecords((prev) =>
          onlyActiveRecords([
            updated,
            ...prev.filter((item) => getRecordId(item) !== id),
          ])
        );
        setClosedRecords((prev) =>
          onlyClosedRecords(prev.filter((item) => getRecordId(item) !== id))
        );
        if (viewing && getRecordId(viewing) === id) {
          setViewing(updated);
        }
      }
      await refreshAfterChange(id);
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
      await refreshAfterChange(id);
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
      await refreshAfterChange(id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopenConfirm = async () => {
    if (!reopening) return;
    const id = getRecordId(reopening);
    const obLabel = reopening.obNumber || 'OBE';
    setBusyId(id);
    setNotice('');
    setNoticeTone('info');
    try {
      const updated = await reopenClosedOB(id);
      const sameCase = {
        ...(updated || reopening),
        id,
        status: updated?.status || 'Under Investigation',
      };

      // Immediately move the SAME record: leave Closed tab, enter active OBE Records.
      setClosedRecords((prev) =>
        onlyClosedRecords(prev.filter((item) => getRecordId(item) !== id))
      );
      setRecords((prev) =>
        onlyActiveRecords([
          sameCase,
          ...prev.filter((item) => getRecordId(item) !== id),
        ])
      );

      setReopening(null);
      setActiveTab(TAB_RECORDS);
      setNoticeTone('success');
      setNotice(
        `OBE reopened successfully. ${obLabel} is now Under Investigation (same OB record, no duplicate created).`
      );

      await Promise.all([loadActive(), loadClosed()]);

      if (viewing && getRecordId(viewing) === id) {
        try {
          const details = updated?.id ? updated : await getOBById(id);
          setViewing(details || sameCase);
        } catch {
          setViewing(sameCase);
        }
      }
    } catch (err) {
      setNoticeTone('error');
      setNotice(err.message || 'Unable to re-open this OBE case.');
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
      await deleteOBRecord(id);
      setConfirmTarget(null);
      setNotice('OB record deleted successfully.');
      await Promise.all([loadActive(), loadClosed(), loadLookups()]);
    } catch (err) {
      setNotice(err.message || 'Unable to delete OB record.');
      setConfirmTarget(null);
    } finally {
      setBusyId(null);
    }
  };

  const headerActions = useMemo(() => {
    if (!isAdmin || activeTab !== TAB_RECORDS) return null;
    return (
      <button type="button" className="btn btn--primary" onClick={() => setCreateOpen(true)}>
        Create OB Record
      </button>
    );
  }, [isAdmin, activeTab]);

  const activeStatuses = useMemo(
    () => OB_STATUSES.filter((item) => item !== 'Closed'),
    []
  );

  return (
    <div className="page-stack">
      <section className="panel premium-section">
        <PageSectionHeader
          title="OBE RECORDS"
          subtitle="Manage OBE cases and previously closed records."
          tabs={obTabs}
          activeId={activeTab}
          onSelectTab={setActiveTab}
          actions={headerActions}
          ariaLabel="OBE Records tabs"
        />

        <div className="premium-section__body">
          {notice ? (
            <div
              className={`alert alert--${
                noticeTone === 'success'
                  ? 'success'
                  : noticeTone === 'error'
                    ? 'error'
                    : 'info'
              }`}
            >
              {notice}
            </div>
          ) : null}

          {activeTab === TAB_RECORDS ? (
            <>
              <div className="toolbar">
                <input
                  className="toolbar__search"
                  type="search"
                  placeholder="Search by OB number, complaint, or citizen"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="">All active statuses</option>
                  {activeStatuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <LoadingState message="Loading OB records…" />
              ) : error ? (
                <ErrorState message={error} onRetry={loadActive} />
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
            </>
          ) : (
            <>
              <p className="premium-section__lead muted">
                Previously closed OBE cases only. Re-open returns the same OB to Under Investigation.
              </p>

              <div className="toolbar">
                <input
                  className="toolbar__search"
                  type="search"
                  placeholder="Search closed OB number, citizen, or police"
                  value={closedSearch}
                  onChange={(event) => setClosedSearch(event.target.value)}
                />
              </div>

              {closedLoading ? (
                <LoadingState message="Loading closed OBE cases…" />
              ) : (
                <ClosedOBTable
                  records={closedRecords}
                  busyId={busyId}
                  onView={handleView}
                  onReopen={openReopenDialog}
                />
              )}
            </>
          )}
        </div>
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
        onClose={clearViewingModal}
        size="lg"
      >
        {viewing?._loading ? (
          <LoadingState message="Loading OB details…" />
        ) : (
          <OBDetails key={getRecordId(viewing)} record={viewing} />
        )}
        {viewing && !viewing._loading && canReopenOB(viewing) && isAdmin ? (
          <div className="form-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => openReopenDialog(viewing)}
            >
              Re-open OBE
            </button>
          </div>
        ) : null}
        {viewing &&
        !viewing._loading &&
        canUpdateOBWorkflow(viewing) &&
        (isAdmin || user?.role === 'police') ? (
          <div className="form-actions">
            {isAdmin && canAssignOB(viewing) ? (
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
            key={getRecordId(assigning)}
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
            key={getRecordId(statusTarget)}
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
            key={getRecordId(investigationTarget)}
            mode="investigation"
            submitting={submitting}
            onCancel={() => setInvestigationTarget(null)}
            onSubmit={handleInvestigationUpdate}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(reopening)}
        title="Re-open OBE"
        onClose={busyId ? undefined : () => setReopening(null)}
        size="md"
        footer={
          <div className="confirm-dialog__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setReopening(null)}
              disabled={Boolean(busyId)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleReopenConfirm}
              disabled={Boolean(busyId)}
            >
              {busyId ? 'Reopening…' : 'Re-open OBE'}
            </button>
          </div>
        }
      >
        {reopening ? (
          <div className="detail-stack">
            <p className="confirm-dialog__message">
              Re-open this closed OBE? The same OB number will return to Under
              Investigation in OBE Records. No new case will be created. All
              previous police assignment, investigation, findings, and evidence
              stay on this record.
            </p>
            <div className="detail-grid">
              <div>
                <span className="detail-label">OB Number</span>
                <strong>{reopening.obNumber || '—'}</strong>
              </div>
              <div>
                <span className="detail-label">Previous Status</span>
                <strong>Closed</strong>
              </div>
              <div>
                <span className="detail-label">New Status</span>
                <strong>Under Investigation</strong>
              </div>
              <div>
                <span className="detail-label">Closed Date</span>
                <strong>{formatDateTime(reopening.closedAt)}</strong>
              </div>
            </div>
          </div>
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
