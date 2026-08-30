import { validateProfileImageFile } from './imageValidation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateProfileEdit(values, { profileImageFile } = {}) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const email = String(values.email ?? '').trim().toLowerCase();
  const phone = String(values.phone ?? '').trim();

  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length > 30) {
    errors.name = 'Name must be at most 30 characters.';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!phone) {
    errors.phone = 'Phone is required.';
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
      email,
      phone,
      profileImageFile: profileImageFile || null,
    },
  };
}

export function validateChangePassword(values) {
  const errors = {};
  const currentPassword = String(values.currentPassword ?? '');
  const newPassword = String(values.newPassword ?? '');
  const confirmPassword = String(values.confirmPassword ?? '');

  if (!currentPassword) {
    errors.currentPassword = 'Current password is required.';
  }

  if (!newPassword.trim()) {
    errors.newPassword = 'New password is required.';
  } else if (newPassword.length < 8) {
    errors.newPassword = 'Password must be at least 8 characters.';
  } else if (!/\S/.test(newPassword)) {
    errors.newPassword = 'Password cannot be empty or spaces only.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm password is required.';
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: { currentPassword, newPassword, confirmPassword },
  };
}

export function getRoleDisplayLabel(role) {
  if (role === 'admin') return 'Admin';
  if (role === 'police') return 'Police';
  if (role === 'citizen') return 'Citizen';
  return role || '—';
}
