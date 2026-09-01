import { COMPLAINT_STATUSES, DEFAULT_REGION } from '../constants/domain';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const ALLOWED_TYPES = new Set([...IMAGE_TYPES, ...VIDEO_TYPES, 'application/pdf']);
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 5;

export function validateEvidenceFiles(files = []) {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];
  if (list.length > MAX_FILES) {
    return {
      ok: false,
      message: `You can upload at most ${MAX_FILES} evidence files.`,
    };
  }

  for (const file of list) {
    const type = String(file.type || '').toLowerCase();
    if (!ALLOWED_TYPES.has(type)) {
      return {
        ok: false,
        message: 'Evidence must be an image (JPEG, PNG, WebP), video (MP4, WebM, MOV), or PDF.',
      };
    }
    if (file.size > MAX_FILE_BYTES) {
      return {
        ok: false,
        message: `${file.name || 'File'} must be 25MB or smaller.`,
      };
    }
  }

  return { ok: true, files: list };
}

export function validateComplaintForm(values, { evidenceFiles = [] } = {}) {
  const errors = {};
  const citizenId = String(values.citizenId ?? '').trim();
  const category = String(values.category ?? '').trim();
  const description = String(values.description ?? '').trim();
  const incidentDate = String(values.incidentDate ?? '').trim();
  const region = String(values.region ?? DEFAULT_REGION).trim() || DEFAULT_REGION;
  const district = String(values.district ?? '').trim();
  const village = String(values.village ?? '').trim();
  const area = String(values.area ?? '').trim();
  const evidenceNotes = String(values.evidenceNotes ?? '').trim();
  const status = String(values.status ?? '').trim();
  const note = String(values.note ?? '').trim();
  const location =
    String(values.location ?? '').trim() ||
    [district, village, area].filter(Boolean).join(', ');

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

  if (!district) {
    errors.district = 'District is required.';
  }

  if (!location) {
    errors.location = 'Location is required.';
  }

  if (status && !COMPLAINT_STATUSES.includes(status)) {
    errors.status = 'Invalid status.';
  }

  const evidenceCheck = validateEvidenceFiles(evidenceFiles);
  if (!evidenceCheck.ok) {
    errors.evidence = evidenceCheck.message;
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
      region,
      district,
      village,
      area,
      evidenceNotes,
      status: status || undefined,
      note: note || undefined,
      evidenceFiles: evidenceCheck.files || [],
    },
  };
}
