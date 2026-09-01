import { useEffect, useState } from 'react';

const STATUS_ACTIONS = [
  { value: 'resolve', label: 'Resolve' },
  { value: 'close', label: 'Close' },
];

const INVESTIGATION_ACTIONS = [
  { value: 'start', label: 'Start investigation' },
  { value: 'note', label: 'Add investigation note' },
  { value: 'complete', label: 'Complete investigation' },
];

export default function OBStatusForm({
  mode = 'status',
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const actions = mode === 'investigation' ? INVESTIGATION_ACTIONS : STATUS_ACTIONS;
  const [action, setAction] = useState(actions[0]?.value || '');
  const [note, setNote] = useState('');
  const [citizenSummary, setCitizenSummary] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setAction(actions[0]?.value || '');
    setNote('');
    setCitizenSummary('');
    setFormError('');
  }, [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!action) {
      setFormError('Please select an action.');
      return;
    }
    if (mode === 'investigation' && action === 'note' && !note.trim()) {
      setFormError('Note is required for investigation updates.');
      return;
    }
    try {
      await onSubmit({
        action,
        note: note.trim(),
        citizenSummary: citizenSummary.trim(),
      });
    } catch (error) {
      setFormError(error.message || 'Unable to update OB.');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <label className="field field--full">
        <span>Action</span>
        <select value={action} onChange={(event) => setAction(event.target.value)}>
          {actions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field field--full">
        <span>Note</span>
        <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>

      {mode === 'investigation' ? (
        <label className="field field--full">
          <span>Citizen Summary</span>
          <textarea
            rows={2}
            value={citizenSummary}
            onChange={(event) => setCitizenSummary(event.target.value)}
            placeholder="Optional summary visible to the citizen"
          />
        </label>
      ) : null}

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Update OB'}
        </button>
      </div>
    </form>
  );
}
