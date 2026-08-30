import { useEffect, useRef, useState } from 'react';
import {
  EMPTY_OCCURRENCE_FORM,
  FALLBACK_CATEGORIES,
  FALLBACK_PRIORITIES,
  validateOccurrenceForm,
} from '../../validation/occurrenceValidation';

function toDateInput(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function asText(value) {
  return String(value ?? '').trim();
}

function buildInitialState(initialValues) {
  return {
    ...EMPTY_OCCURRENCE_FORM,
    ...initialValues,
    occurrenceDate:
      toDateInput(initialValues?.occurrenceDate) || initialValues?.occurrenceDate || '',
    followUpDate: toDateInput(initialValues?.followUpDate) || '',
    assignedOfficer:
      initialValues?.assignedOfficer?.id || initialValues?.assignedOfficer || '',
    priority: initialValues?.priority || 'MEDIUM',
  };
}

export default function OccurrenceForm({
  initialValues,
  categories = [],
  priorities = [],
  officers = [],
  submitting = false,
  submitLabel = 'Create',
  formKey = 0,
  resetOnSuccess = false,
  onCancel,
  onSubmit,
}) {
  const [values, setValues] = useState(() => buildInitialState(initialValues));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const alertRef = useRef(null);
  const inFlightRef = useRef(false);

  const categoryOptions =
    Array.isArray(categories) && categories.length > 0 ? categories : FALLBACK_CATEGORIES;
  const priorityOptions =
    Array.isArray(priorities) && priorities.length > 0 ? priorities : FALLBACK_PRIORITIES;

  useEffect(() => {
    setValues(buildInitialState(initialValues));
    setErrors({});
    setFormError('');
    setFormSuccess('');
    inFlightRef.current = false;
    // Reset only when opening a fresh form instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey]);

  useEffect(() => {
    if ((formError || formSuccess) && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [formError, formSuccess]);

  const setField = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (inFlightRef.current || submitting) {
      return;
    }

    setFormError('');
    setFormSuccess('');

    const result = validateOccurrenceForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      const messages = Object.values(result.errors);
      setFormError(messages.join(' ') || 'Please fill in all required fields correctly.');
      console.warn('Occurrence form validation failed:', result.errors);
      return;
    }

    const payload = {
      occurrenceDate: asText(values.occurrenceDate),
      occurrenceTime: asText(values.occurrenceTime),
      station: asText(values.station),
      district: asText(values.district),
      complainantName: asText(values.complainantName),
      complainantPhone: asText(values.complainantPhone),
      complainantAddress: asText(values.complainantAddress),
      category: asText(values.category),
      occurrenceType: asText(values.occurrenceType) || asText(values.category),
      subject: asText(values.subject),
      description: asText(values.description),
      location: asText(values.location),
      priority: asText(values.priority) || 'MEDIUM',
      actionTaken: asText(values.actionTaken),
      followUpNotes: asText(values.followUpNotes),
      additionalNotes: asText(values.additionalNotes),
    };

    if (asText(values.assignedOfficer)) {
      payload.assignedOfficer = asText(values.assignedOfficer);
    }
    if (asText(values.followUpDate)) {
      payload.followUpDate = asText(values.followUpDate);
    }

    inFlightRef.current = true;
    console.info('[OB] POST /api/ob/staff payload:', payload);

    try {
      const saved = await onSubmit(payload);
      if (!saved) {
        return undefined;
      }
      setFormSuccess('Data has been saved successfully.');
      if (resetOnSuccess) {
        setValues(buildInitialState(EMPTY_OCCURRENCE_FORM));
        setErrors({});
      }
      console.info('[OB] Saved occurrence:', saved?.obNumber || saved?.id);
      return saved;
    } catch (err) {
      console.error('[OB] Create/update failed:', err);
      setFormError(err.message || 'Failed to save occurrence. Please try again.');
      return undefined;
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <form className="form-grid form-grid--two" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div ref={alertRef} className="alert alert--error field--full">
          {formError}
        </div>
      ) : null}
      {formSuccess ? (
        <div ref={alertRef} className="alert alert--success field--full">
          {formSuccess}
        </div>
      ) : null}

      <label className="field">
        <span>Date *</span>
        <input
          type="date"
          value={values.occurrenceDate}
          onChange={(e) => setField('occurrenceDate', e.target.value)}
          disabled={submitting}
          required
        />
        {errors.occurrenceDate ? <span className="field-error">{errors.occurrenceDate}</span> : null}
      </label>

      <label className="field">
        <span>Time *</span>
        <input
          type="time"
          value={values.occurrenceTime}
          onChange={(e) => setField('occurrenceTime', e.target.value)}
          disabled={submitting}
          required
        />
        {errors.occurrenceTime ? <span className="field-error">{errors.occurrenceTime}</span> : null}
      </label>

      <label className="field">
        <span>Station *</span>
        <input
          type="text"
          value={values.station}
          onChange={(e) => setField('station', e.target.value)}
          placeholder="e.g. Mogadishu Central"
          disabled={submitting}
          required
        />
        {errors.station ? <span className="field-error">{errors.station}</span> : null}
      </label>

      <label className="field">
        <span>District *</span>
        <input
          type="text"
          value={values.district}
          onChange={(e) => setField('district', e.target.value)}
          disabled={submitting}
          required
        />
        {errors.district ? <span className="field-error">{errors.district}</span> : null}
      </label>

      <label className="field">
        <span>Complainant name *</span>
        <input
          type="text"
          value={values.complainantName}
          onChange={(e) => setField('complainantName', e.target.value)}
          disabled={submitting}
          required
        />
        {errors.complainantName ? (
          <span className="field-error">{errors.complainantName}</span>
        ) : null}
      </label>

      <label className="field">
        <span>Complainant phone *</span>
        <input
          type="tel"
          value={values.complainantPhone}
          onChange={(e) => setField('complainantPhone', e.target.value)}
          disabled={submitting}
          required
        />
        {errors.complainantPhone ? (
          <span className="field-error">{errors.complainantPhone}</span>
        ) : null}
      </label>

      <label className="field field--full">
        <span>Complainant address</span>
        <input
          type="text"
          value={values.complainantAddress}
          onChange={(e) => setField('complainantAddress', e.target.value)}
          disabled={submitting}
        />
      </label>

      <label className="field">
        <span>Category *</span>
        <select
          value={values.category}
          onChange={(e) => setField('category', e.target.value)}
          disabled={submitting}
          required
        >
          <option value="">Select category</option>
          {categoryOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {errors.category ? <span className="field-error">{errors.category}</span> : null}
      </label>

      <label className="field">
        <span>Priority *</span>
        <select
          value={values.priority}
          onChange={(e) => setField('priority', e.target.value)}
          disabled={submitting}
          required
        >
          {priorityOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {errors.priority ? <span className="field-error">{errors.priority}</span> : null}
      </label>

      <label className="field field--full">
        <span>Subject / title *</span>
        <input
          type="text"
          value={values.subject}
          onChange={(e) => setField('subject', e.target.value)}
          disabled={submitting}
          required
        />
        {errors.subject ? <span className="field-error">{errors.subject}</span> : null}
      </label>

      <label className="field field--full">
        <span>Description *</span>
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
          disabled={submitting}
          required
        />
        {errors.description ? <span className="field-error">{errors.description}</span> : null}
      </label>

      <label className="field">
        <span>Location *</span>
        <input
          type="text"
          value={values.location}
          onChange={(e) => setField('location', e.target.value)}
          disabled={submitting}
          required
        />
        {errors.location ? <span className="field-error">{errors.location}</span> : null}
      </label>

      <label className="field">
        <span>Assigned officer</span>
        <select
          value={values.assignedOfficer}
          onChange={(e) => setField('assignedOfficer', e.target.value)}
          disabled={submitting}
        >
          <option value="">Unassigned</option>
          {officers.map((officer) => (
            <option key={officer.id} value={officer.id}>
              {officer.name}
              {officer.badgeNumber ? ` (${officer.badgeNumber})` : ''}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Follow-up date</span>
        <input
          type="date"
          value={values.followUpDate}
          onChange={(e) => setField('followUpDate', e.target.value)}
          disabled={submitting}
        />
      </label>

      <label className="field">
        <span>Action taken</span>
        <input
          type="text"
          value={values.actionTaken}
          onChange={(e) => setField('actionTaken', e.target.value)}
          disabled={submitting}
        />
      </label>

      <label className="field field--full">
        <span>Follow-up notes</span>
        <textarea
          rows={2}
          value={values.followUpNotes}
          onChange={(e) => setField('followUpNotes', e.target.value)}
          disabled={submitting}
        />
      </label>

      <label className="field field--full">
        <span>Additional notes</span>
        <textarea
          rows={2}
          value={values.additionalNotes}
          onChange={(e) => setField('additionalNotes', e.target.value)}
          disabled={submitting}
        />
      </label>

      <div className="form-actions field--full">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting
            ? submitLabel.toLowerCase().includes('save')
              ? 'Saving...'
              : 'Creating...'
            : submitLabel}
        </button>
      </div>
    </form>
  );
}
