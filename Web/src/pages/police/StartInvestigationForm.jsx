import { useEffect, useState } from 'react';

export default function StartInvestigationForm({
  records = [],
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [obId, setObId] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setObId(records[0]?.id || '');
    setNote('');
    setFormError('');
  }, [records]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!obId) {
      setFormError('Please select an OB record.');
      return;
    }
    try {
      await onSubmit({ id: obId, note: note.trim() });
    } catch (error) {
      setFormError(error.message || 'Unable to start investigation.');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <label className="field field--full">
        <span>OB Record</span>
        <select value={obId} onChange={(event) => setObId(event.target.value)}>
          <option value="">Select OB record</option>
          {records.map((record) => (
            <option key={record.id} value={record.id}>
              {record.obNumber} — {record.complaint?.complaintNumber || 'Complaint'} ({record.status})
            </option>
          ))}
        </select>
      </label>

      <label className="field field--full">
        <span>Note (optional)</span>
        <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={submitting || !records.length}>
          {submitting ? 'Starting…' : 'Start investigation'}
        </button>
      </div>
    </form>
  );
}
