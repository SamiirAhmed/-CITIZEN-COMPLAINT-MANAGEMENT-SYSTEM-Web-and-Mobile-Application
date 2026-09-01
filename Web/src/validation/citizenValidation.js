import { validateProfileImageFile } from './imageValidation';
import { EMAIL_PATTERN } from './userValidation';

const NAME_LETTERS_PATTERN = /^[A-Za-z\s]+$/;
const DIGITS_ONLY_PATTERN = /^\d+$/;
const NIRA_ID_PATTERN = /^\d{11}$/;

function phoneDigitsOnly(phone) {
  return String(phone ?? '')
    .replace(/[\s-]/g, '')
    .replace(/^\+/, '');
}

export function validateCitizenRegistration(values, { profileImageFile } = {}) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const niraId = String(values.niraId ?? '').trim();
  const phone = String(values.phone ?? '').trim();
  const email = String(values.email ?? '').trim().toLowerCase();
  const password = String(values.password ?? '');
  const confirmPassword = String(values.confirmPassword ?? '');

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
    errors.phone = 'Phone Number is required.';
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

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm password is required.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
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
      password,
      confirmPassword,
      profileImageFile: profileImageFile || null,
    },
  };
}

export function validateCitizenEdit(values, { profileImageFile } = {}) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const phone = String(values.phone ?? '').trim();
  const email = String(values.email ?? '').trim().toLowerCase();
  const niraId = String(values.niraId ?? '').trim();

  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length > 30) {
    errors.name = 'Name must be at most 30 characters.';
  } else if (!NAME_LETTERS_PATTERN.test(name)) {
    errors.name = 'Name must contain letters only.';
  }

  if (!phone) {
    errors.phone = 'Phone Number is required.';
  } else {
    const digits = phoneDigitsOnly(phone);
    if (!DIGITS_ONLY_PATTERN.test(digits)) {
      errors.phone = 'Phone must contain numbers only.';
    } else if (digits.length < 7 || digits.length > 15) {
      errors.phone = 'Please enter a valid phone number.';
    }
  }

  if (niraId && !NIRA_ID_PATTERN.test(niraId)) {
    errors.niraId = 'NIRA ID must be exactly 11 numbers.';
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
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
      niraId,
      profileImageFile: profileImageFile || null,
    },
  };
}
