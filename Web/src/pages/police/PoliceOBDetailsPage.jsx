import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EvidenceList from '../../components/common/EvidenceList';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import StatusBadge from '../../components/common/StatusBadge';
import {
  addInvestigationEvidence,
  getStaffOBById,
  updateInvestigation,
} from '../../services/obService';
import { formatDateTime } from './policeFormat';
import { PRINT_MODES, triggerPrint } from '../../utils/printPage';

export default function PoliceOBDetailsPage() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [completeOpen, setCompleteOpen] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceKey, setEvidenceKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const next = await getStaffOBById(id);
      setRecord(next);
    } catch (err) {
      setError(err.message || 'Unable to load OB record.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const applyRecord = (next) => {
    if (!next) return;
    setRecord(next);
  };

  const runAction = async (action, payload, successMessage) => {
    setBusy(action);
    setNotice('');
    setError('');
    try {
      const updated = await updateInvestigation(id, { action, ...payload });
      applyRecord(updated);
      setNotice(successMessage);
      return true;
    } catch (err) {
      setError(err.message || 'Unable to update investigation.');
      return false;
    } finally {
      setBusy('');
    }
  };

  const handleStart = () =>
    runAction('start', {}, 'Investigation started.');

  const handleNote = async (event) => {
    event.preventDefault();
    const ok = await runAction('note', { note: noteText }, 'Note added.');
    if (ok) setNoteText('');
  };

  const handleEvidence = async (event) => {
    event.preventDefault();
    setBusy('evidence');
    setNotice('');
    setError('');
    try {
      const updated = await addInvestigationEvidence(id, {
        file: evidenceFile,
        note: evidenceNote,
      });
      applyRecord(updated);
      setEvidenceNote('');
      setEvidenceFile(null);
      setEvidenceKey((value) => value + 1);
      setNotice('Evidence added.');
    } catch (err) {
      setError(err.message || 'Unable to add evidence.');
    } finally {
      setBusy('');
    }
  };

  const handleComplete = async () => {
    const ok = await runAction('complete', {}, 'Investigation completed.');
    if (ok) {
      setCompleteOpen(false);
    }
  };

  if (loading) return <LoadingState message="Loading OB record…" />;
  if (error && !record) return <ErrorState message={error} onRetry={load} />;
  if (!record) {
    return (
      <ErrorState
        title="OB record not found"
        message="This record is not assigned to you or does not exist."
      />
    );
  }

  const complaint = record.complaint || {};
  const citizen = record.citizen || {};
  const officer = record.assignedOfficer || {};
  const canStart = ['Assigned', 'Opened', 'Reopened'].includes(record.status);
  const canWork = record.status === 'Under Investigation';

  return (
    <div className="page-stack">
      <div className="page-actions">
        <Link to="/ob-records" className="btn btn--ghost">
          ← Back to My OB Records
        </Link>
        <div className="action-row">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => triggerPrint(PRINT_MODES.obDetails)}
          >
            Print OB
          </button>
          {canStart ? (
            <button
              type="button"
              className="btn btn--primary"
              disabled={Boolean(busy)}
              onClick={handleStart}
            >
              {busy === 'start' ? 'Starting…' : 'Start Investigation'}
            </button>
          ) : null}
          {canWork ? (
            <button
              type="button"
              className="btn btn--danger"
              disabled={Boolean(busy)}
              onClick={() => setCompleteOpen(true)}
            >
              Complete Investigation
            </button>
          ) : null}
        </div>
      </div>

      {notice ? <div className="alert alert--success">{notice}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="ob-print">
      <div className="print-only print-ob-header">
        <h1>OB Record</h1>
        <p>{record.obNumber}</p>
        <p className="print-ob-header__meta">Printed {new Date().toLocaleString()}</p>
      </div>

      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>{record.obNumber}</h2>
            <p className="muted">OB record details and investigation workspace.</p>
          </div>
          <StatusBadge status={record.status} />
        </div>
        <div className="detail-grid">
          <div>
            <span className="detail-label">OB Number</span>
            <strong>{record.obNumber || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Status</span>
            <StatusBadge status={record.status} />
          </div>
          <div>
            <span className="detail-label">Opened</span>
            <strong>{formatDateTime(record.createdAt)}</strong>
          </div>
          <div>
            <span className="detail-label">Last updated</span>
            <strong>{formatDateTime(record.updatedAt)}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>Complaint / Report</h2>
        </div>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Complaint number</span>
            <strong>{complaint.complaintNumber || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Category</span>
            <strong>{complaint.category || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Incident date</span>
            <strong>{formatDateTime(complaint.incidentDate)}</strong>
          </div>
          <div>
            <span className="detail-label">Location</span>
            <strong>{complaint.location || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Citizen</span>
            <strong>{citizen.name || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Citizen phone</span>
            <strong>{citizen.phone || '—'}</strong>
          </div>
        </div>
        <div className="detail-block">
          <span className="detail-label">Description</span>
          <p>{complaint.description || '—'}</p>
        </div>
        {complaint.relatedInformation ? (
          <div className="detail-block">
            <span className="detail-label">Related information</span>
            <p>{complaint.relatedInformation}</p>
          </div>
        ) : null}
        {complaint.evidenceNotes ? (
          <div className="detail-block">
            <span className="detail-label">Complaint evidence notes</span>
            <p>{complaint.evidenceNotes}</p>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>Assignment</h2>
        </div>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Officer</span>
            <strong>{officer.name || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Badge</span>
            <strong>{officer.badgeNumber || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Station</span>
            <strong>{officer.station || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Assigned at</span>
            <strong>{formatDateTime(record.assignedAt)}</strong>
          </div>
        </div>
      </section>
      </div>

      <section className="panel" id="investigation">
        <div className="panel__header">
          <h2>Investigation</h2>
        </div>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Investigation status</span>
            <StatusBadge status={record.status} />
          </div>
          <div>
            <span className="detail-label">Started</span>
            <strong>{formatDateTime(record.investigationStartedAt)}</strong>
          </div>
          <div>
            <span className="detail-label">Completed</span>
            <strong>{formatDateTime(record.investigationCompletedAt)}</strong>
          </div>
        </div>
        {canStart ? (
          <p className="muted">Start the investigation to add notes and evidence.</p>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>Notes</h2>
        </div>
        {(record.investigationNoteEntries || []).length ? (
          <ul className="timeline-list">
            {(record.investigationNoteEntries || []).map((item, index) => (
              <li key={item.id || index}>
                <strong>{formatDateTime(item.createdAt)}</strong>
                <p>{item.note}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No investigation notes yet.</p>
        )}
        {canWork ? (
          <form className="form-grid form-grid--single" onSubmit={handleNote}>
            <label className="field">
              <span>Add note</span>
              <textarea
                rows="3"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                required
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={Boolean(busy)}>
                {busy === 'note' ? 'Saving…' : 'Add note'}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel__header panel__header--spread">
          <h2>Evidence ({(record.evidence || []).length})</h2>
        </div>
        <EvidenceList
          items={record.evidence || []}
          showHeading={false}
          emptyMessage="No evidence has been uploaded for this case."
        />
        {canWork ? (
          <form className="form-grid form-grid--single" onSubmit={handleEvidence}>
            <label className="field">
              <span>Evidence file (JPEG, PNG, WebP, or PDF)</span>
              <input
                key={evidenceKey}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(event) => setEvidenceFile(event.target.files?.[0] || null)}
              />
            </label>
            <label className="field">
              <span>Evidence note</span>
              <textarea
                rows="3"
                value={evidenceNote}
                onChange={(event) => setEvidenceNote(event.target.value)}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={Boolean(busy)}>
                {busy === 'evidence' ? 'Uploading…' : 'Add evidence'}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <ConfirmDialog
        open={completeOpen}
        title="Complete investigation"
        message="Complete this investigation? This cannot be done again, and all notes and evidence will be kept."
        confirmLabel="Complete"
        cancelLabel="Cancel"
        tone="danger"
        busy={busy === 'complete'}
        onCancel={() => setCompleteOpen(false)}
        onConfirm={handleComplete}
      />
    </div>
  );
}
