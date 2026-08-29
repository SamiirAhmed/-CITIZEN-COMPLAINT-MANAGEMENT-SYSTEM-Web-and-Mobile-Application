import { validateProfileImageFile } from './imageValidation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  }

  if (!phone) {
    errors.phone = 'Phone Number is required.';
  }

  if (niraId && niraId.length !== 11) {
    errors.niraId = 'NIRA ID must be exactly 11 characters.';
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
