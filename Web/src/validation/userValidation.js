import { validateProfileImageFile } from './imageValidation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePoliceRegistration(values, { profileImageFile } = {}) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const niraId = String(values.niraId ?? '').trim();
  const phone = String(values.phone ?? '').trim();
  const email = String(values.email ?? '').trim().toLowerCase();
  const password = String(values.password ?? '');
  const confirmPassword = String(values.confirmPassword ?? '');
  const badgeNumber = String(values.badgeNumber ?? '').trim();
  const station = String(values.station ?? '').trim();

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
    errors.phone = 'Phone Number is required.';
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
    errors.confirmPassword = 'Password and confirm password do not match.';
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
      badgeNumber,
      station,
      profileImageFile: profileImageFile || null,
    },
  };
}

export function validateStaffUserEdit(values, { profileImageFile } = {}) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const phone = String(values.phone ?? '').trim();
  const email = String(values.email ?? '').trim().toLowerCase();
  const badgeNumber = String(values.badgeNumber ?? '').trim();
  const station = String(values.station ?? '').trim();

  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length > 30) {
    errors.name = 'Name must be at most 30 characters.';
  }

  if (!phone) {
    errors.phone = 'Phone Number is required.';
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
      badgeNumber,
      station,
      profileImageFile: profileImageFile || null,
    },
  };
}
