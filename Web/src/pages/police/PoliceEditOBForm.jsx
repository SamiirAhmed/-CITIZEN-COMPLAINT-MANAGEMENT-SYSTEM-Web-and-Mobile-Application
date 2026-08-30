import { useEffect, useState } from 'react';

export default function PoliceEditOBForm({
  record,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [citizenSummary, setCitizenSummary] = useState(record?.citizenSummary || '');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setCitizenSummary(record?.citizenSummary || '');
    setNote('');
    setFormError('');
  }, [record]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    try {
      await onSubmit({
        citizenSummary: citizenSummary.trim(),
        note: note.trim(),
      });
    } catch (error) {
      setFormError(error.message || 'Unable to update OB record.');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <div className="field field--full">
        <span>OB Number</span>
        <input value={record?.obNumber || ''} readOnly disabled className="input--readonly" />
      </div>

      <label className="field field--full">
        <span>Citizen Summary</span>
        <textarea
          rows={4}
          value={citizenSummary}
          onChange={(event) => setCitizenSummary(event.target.value)}
        />
      </label>

      <label className="field field--full">
        <span>Internal note (optional)</span>
        <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
