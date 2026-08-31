import { validateProfileImageFile } from './imageValidation';

/** Requires local@domain.tld — rejects admin@gmail */
export const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const NAME_LETTERS_PATTERN = /^[A-Za-z\s]+$/;
const DIGITS_ONLY_PATTERN = /^\d+$/;
const NIRA_ID_PATTERN = /^\d{11}$/;
const STAFF_ROLES = new Set(['admin', 'police']);

function phoneDigitsOnly(phone) {
  return String(phone ?? '')
    .replace(/[\s-]/g, '')
    .replace(/^\+/, '');
}

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
  } else if (!NAME_LETTERS_PATTERN.test(name)) {
    errors.name = 'Name must contain letters only.';
  }

  if (!niraId) {
    errors.niraId = 'NIRA ID is required.';
  } else if (!NIRA_ID_PATTERN.test(niraId)) {
    errors.niraId = 'NIRA ID must be exactly 11 numbers.';
  }

  if (!phone) {
    errors.phone = 'Phone is required.';
  } else {
    const digits = phoneDigitsOnly(phone);
    if (!DIGITS_ONLY_PATTERN.test(digits)) {
      errors.phone = 'Phone must contain numbers only.';
    } else if (digits.length < 7 || digits.length > 15) {
      errors.phone = 'Please enter a valid phone number.';
    }
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
  } else if (!NAME_LETTERS_PATTERN.test(name)) {
    errors.name = 'Name must contain letters only.';
  }

  if (!phone) {
    errors.phone = 'Phone is required.';
  } else {
    const digits = phoneDigitsOnly(phone);
    if (!DIGITS_ONLY_PATTERN.test(digits)) {
      errors.phone = 'Phone must contain numbers only.';
    } else if (digits.length < 7 || digits.length > 15) {
      errors.phone = 'Please enter a valid phone number.';
    }
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
