import { useEffect, useState } from 'react';

export default function AssignOfficerForm({
  officers = [],
  initialOfficerId = '',
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [officerId, setOfficerId] = useState(initialOfficerId || '');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setOfficerId(initialOfficerId || '');
    setFormError('');
  }, [initialOfficerId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!officerId) {
      setFormError('Please select an officer.');
      return;
    }
    try {
      await onSubmit(officerId);
    } catch (error) {
      setFormError(error.message || 'Unable to assign officer.');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <label className="field field--full">
        <span>Police Officer</span>
        <select value={officerId} onChange={(event) => setOfficerId(event.target.value)}>
          <option value="">Select officer</option>
          {officers.map((officer) => (
            <option key={officer.id} value={officer.id}>
              {officer.name}
              {officer.badgeNumber ? ` (${officer.badgeNumber})` : ''}
            </option>
          ))}
        </select>
      </label>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Assigning…' : 'Assign officer'}
        </button>
      </div>
    </form>
  );
}
