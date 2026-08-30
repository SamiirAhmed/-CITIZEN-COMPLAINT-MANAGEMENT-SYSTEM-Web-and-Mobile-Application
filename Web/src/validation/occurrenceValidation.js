const REQUIRED = [
  ['occurrenceDate', 'Date is required.'],
  ['occurrenceTime', 'Time is required.'],
  ['station', 'Station is required.'],
  ['complainantName', 'Complainant name is required.'],
  ['complainantPhone', 'Complainant phone is required.'],
  ['category', 'Category is required.'],
  ['subject', 'Subject is required.'],
  ['description', 'Description is required.'],
  ['location', 'Location is required.'],
  ['district', 'District is required.'],
  ['priority', 'Priority is required.'],
];

export function validateOccurrenceForm(values) {
  const errors = {};

  REQUIRED.forEach(([key, message]) => {
    if (!String(values[key] ?? '').trim()) {
      errors[key] = message;
    }
  });

  if (values.complainantPhone && String(values.complainantPhone).replace(/\D/g, '').length < 7) {
    errors.complainantPhone = 'Enter a valid phone number (at least 7 digits).';
  }

  if (values.subject && String(values.subject).trim().length > 200) {
    errors.subject = 'Subject must be 200 characters or fewer.';
  }

  if (values.description && String(values.description).trim().length < 5) {
    errors.description = 'Description must be at least 5 characters.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}

export const FALLBACK_CATEGORIES = [
  'Theft',
  'Assault',
  'Accident',
  'Missing Person',
  'Domestic Incident',
  'Property Damage',
  'Fraud',
  'Lost Property',
  'Disturbance',
  'Suspicious Activity',
  'Traffic Incident',
  'Other',
];

export const FALLBACK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const EMPTY_OCCURRENCE_FORM = {
  occurrenceDate: '',
  occurrenceTime: '',
  station: '',
  complainantName: '',
  complainantPhone: '',
  complainantAddress: '',
  category: '',
  occurrenceType: '',
  subject: '',
  description: '',
  location: '',
  district: '',
  priority: 'MEDIUM',
  assignedOfficer: '',
  followUpDate: '',
  followUpNotes: '',
  actionTaken: '',
  additionalNotes: '',
};
