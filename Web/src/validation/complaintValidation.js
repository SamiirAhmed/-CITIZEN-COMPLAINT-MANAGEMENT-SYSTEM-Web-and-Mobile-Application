import { COMPLAINT_STATUSES } from '../constants/domain';

export function validateComplaintForm(values) {
  const errors = {};
  const citizenId = String(values.citizenId ?? '').trim();
  const category = String(values.category ?? '').trim();
  const description = String(values.description ?? '').trim();
  const incidentDate = String(values.incidentDate ?? '').trim();
  const location = String(values.location ?? '').trim();
  const relatedInformation = String(values.relatedInformation ?? '').trim();
  const evidenceNotes = String(values.evidenceNotes ?? '').trim();
  const status = String(values.status ?? '').trim();
  const note = String(values.note ?? '').trim();

  if (!citizenId) {
    errors.citizenId = 'Citizen is required.';
  }

  if (!category) {
    errors.category = 'Category is required.';
  }

  if (!description) {
    errors.description = 'Description is required.';
  }

  if (!incidentDate) {
    errors.incidentDate = 'Incident date is required.';
  } else if (Number.isNaN(new Date(incidentDate).getTime())) {
    errors.incidentDate = 'Please enter a valid incident date.';
  }

  if (!location) {
    errors.location = 'Location is required.';
  }

  if (status && !COMPLAINT_STATUSES.includes(status)) {
    errors.status = 'Invalid status.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      citizenId,
      category,
      description,
      incidentDate,
      location,
      relatedInformation,
      evidenceNotes,
      status: status || undefined,
      note: note || undefined,
    },
  };
}
