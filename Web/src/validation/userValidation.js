import { validateProfileImageFile } from './imageValidation';

/** Requires local@domain.tld — rejects admin@gmail */
export const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const STAFF_ROLES = new Set(['admin', 'police']);

export function validateStaffRegistration(values, { profileImageFile } = {}) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const niraId = String(values.niraId ?? '').trim();
  const phone = String(values.phone ?? '').trim();
  const email = String(values.email ?? '').trim().toLowerCase();
  const role = String(values.role ?? 'police').trim().toLowerCase();
  const badgeNumber = String(values.badgeNumber ?? '').trim();
  const station = String(values.station ?? '').trim();
  const region = String(values.region ?? '').trim();
  const district = String(values.district ?? '').trim();
  const village = String(values.village ?? '').trim();
  const area = String(values.area ?? '').trim();

  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length > 30) {
    errors.name = 'Name must be at most 30 characters.';
  }

  if (!niraId) {
    errors.niraId = 'NIRA ID is required.';
  } else if (niraId.length !== 11) {
    errors.niraId = 'NIRA ID must be exactly 11 characters.';
  }

  if (!phone) {
    errors.phone = 'Phone is required.';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!STAFF_ROLES.has(role)) {
    errors.role = 'Role must be Admin or Police.';
  }

  if (!district) {
    errors.district = 'Please select a district.';
  }

  if (area && !village) {
    errors.village = 'Please select a village before selecting an area.';
  }

  const imageCheck = validateProfileImageFile(profileImageFile, { required: true });
  if (!imageCheck.ok) {
    errors.profileImage = imageCheck.message;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      niraId,
      phone,
      email,
      role,
      badgeNumber,
      station,
      region,
      district,
      village,
      area,
      profileImageFile: profileImageFile || null,
    },
  };
}

/** @deprecated Use validateStaffRegistration */
export const validatePoliceRegistration = validateStaffRegistration;

export function validateStaffUserEdit(values, { profileImageFile } = {}) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const phone = String(values.phone ?? '').trim();
  const email = String(values.email ?? '').trim().toLowerCase();
  const badgeNumber = String(values.badgeNumber ?? '').trim();
  const station = String(values.station ?? '').trim();
  const region = String(values.region ?? '').trim();
  const district = String(values.district ?? '').trim();
  const village = String(values.village ?? '').trim();
  const area = String(values.area ?? '').trim();

  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length > 30) {
    errors.name = 'Name must be at most 30 characters.';
  }

  if (!phone) {
    errors.phone = 'Phone is required.';
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!district) {
    errors.district = 'Please select a district.';
  }

  if (area && !village) {
    errors.village = 'Please select a village before selecting an area.';
  }

  if (profileImageFile) {
    const imageCheck = validateProfileImageFile(profileImageFile);
    if (!imageCheck.ok) {
      errors.profileImage = imageCheck.message;
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      phone,
      email,
      badgeNumber,
      station,
      region,
      district,
      village,
      area,
      profileImageFile: profileImageFile || null,
    },
  };
}
