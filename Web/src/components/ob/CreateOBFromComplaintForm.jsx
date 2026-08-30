import { useEffect, useState } from 'react';

export default function CreateOBFromComplaintForm({
  complaints = [],
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [complaintId, setComplaintId] = useState('');
  const [citizenSummary, setCitizenSummary] = useState(
    'Occurrence Book opened for your complaint.'
  );
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setComplaintId('');
    setCitizenSummary('Occurrence Book opened for your complaint.');
    setFormError('');
  }, [complaints]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!complaintId) {
      setFormError('Please select a complaint.');
      return;
    }
    try {
      await onSubmit({
        complaintId,
        citizenSummary: citizenSummary.trim(),
      });
    } catch (error) {
      setFormError(error.message || 'Unable to create OB record.');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <label className="field field--full">
        <span>Complaint</span>
        <select value={complaintId} onChange={(event) => setComplaintId(event.target.value)}>
          <option value="">Select complaint</option>
          {complaints.map((complaint) => (
            <option key={complaint.id} value={complaint.id}>
              {complaint.complaintNumber} — {complaint.citizen?.name || 'Citizen'} (
              {complaint.status})
            </option>
          ))}
        </select>
      </label>

      <label className="field field--full">
        <span>Citizen Summary</span>
        <textarea
          rows={3}
          value={citizenSummary}
          onChange={(event) => setCitizenSummary(event.target.value)}
        />
      </label>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create OB record'}
        </button>
      </div>
    </form>
  );
}
