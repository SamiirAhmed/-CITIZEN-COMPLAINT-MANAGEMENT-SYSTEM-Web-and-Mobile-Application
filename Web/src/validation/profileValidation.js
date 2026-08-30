<<<<<<< HEAD
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/i;

export function validateProfileForm(values) {
=======
import { validateProfileImageFile } from './imageValidation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateProfileEdit(values, { profileImageFile } = {}) {
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
  const errors = {};
  const name = String(values.name ?? '').trim();
  const email = String(values.email ?? '').trim().toLowerCase();
  const phone = String(values.phone ?? '').trim();
<<<<<<< HEAD
  const address = String(values.address ?? '').trim();
  const username = String(values.username ?? '').trim().toLowerCase();
  const currentPassword = String(values.currentPassword ?? '');
  const newPassword = String(values.newPassword ?? '');
  const confirmNewPassword = String(values.confirmNewPassword ?? '');
  const wantsPasswordChange = Boolean(
    currentPassword || newPassword || confirmNewPassword
  );

  if (!name) {
    errors.name = 'Full name is required.';
  } else if (name.length > 30) {
    errors.name = 'Full name must be at most 30 characters.';
=======

  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length > 30) {
    errors.name = 'Name must be at most 30 characters.';
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!phone) {
<<<<<<< HEAD
    errors.phone = 'Phone number is required.';
  }

  if (!address) {
    errors.address = 'Address is required.';
  }

  if (!username) {
    errors.username = 'Username is required.';
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username =
      'Username must be 3-30 characters using letters, numbers, dots, underscores, or hyphens.';
  }

  if (wantsPasswordChange) {
    if (!currentPassword) {
      errors.currentPassword = 'Current password is required.';
    }
    if (!newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters.';
    }
    if (!confirmNewPassword) {
      errors.confirmNewPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = 'New password and confirmation do not match.';
=======
    errors.phone = 'Phone is required.';
  }

  if (profileImageFile) {
    const imageCheck = validateProfileImageFile(profileImageFile);
    if (!imageCheck.ok) {
      errors.profileImage = imageCheck.message;
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      email,
      phone,
<<<<<<< HEAD
      address,
      username,
      avatar: values.avatar || '',
      wantsPasswordChange,
      currentPassword,
      newPassword,
      confirmNewPassword,
=======
      profileImageFile: profileImageFile || null,
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
    },
  };
}

<<<<<<< HEAD
export function defaultUsernameFromUser(user) {
  if (user?.username) {
    return user.username;
  }
  if (user?.email) {
    return String(user.email).split('@')[0].toLowerCase();
  }
  return '';
=======
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
  if (role === 'police') return 'Police Officer';
  if (role === 'citizen') return 'Citizen';
  return role || '—';
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
}
