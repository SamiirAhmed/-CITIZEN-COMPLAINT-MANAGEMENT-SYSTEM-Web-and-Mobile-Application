const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) =>
  EMAIL_REGEX.test(String(email || '').trim());

export const validateCitizenRegistration = ({
  name,
  niraId,
  phone,
  tell,
  email,
  password,
  confirmPassword,
}) => {
  const trimmedName = String(name ?? '').trim();
  const trimmedNira = String(niraId ?? '').trim();
  const trimmedPhone = String(phone ?? '').trim();
  const trimmedTell = String(tell ?? '').trim();
  const trimmedEmail = String(email ?? '').trim().toLowerCase();
  const rawPassword = String(password ?? '');

  if (!trimmedName) {
    return { ok: false, message: 'Name is required.' };
  }

  if (trimmedName.length > 30) {
    return { ok: false, message: 'Name must be at most 30 characters.' };
  }

  if (!trimmedNira) {
    return { ok: false, message: 'NIRA ID is required.' };
  }

  if (trimmedNira.length !== 11) {
    return { ok: false, message: 'NIRA ID must be exactly 11 characters.' };
  }

  if (!trimmedPhone) {
    return { ok: false, message: 'Phone is required.' };
  }

  if (trimmedPhone.replace(/[\s-]/g, '').length < 7) {
    return { ok: false, message: 'Please enter a valid phone number.' };
  }

  if (!trimmedTell) {
    return { ok: false, message: 'Tell is required.' };
  }

  if (!trimmedEmail) {
    return { ok: false, message: 'Email is required.' };
  }

  if (!isValidEmail(trimmedEmail)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }

  if (!rawPassword) {
    return { ok: false, message: 'Password is required.' };
  }

  if (rawPassword.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' };
  }

  if (confirmPassword !== undefined && rawPassword !== confirmPassword) {
    return {
      ok: false,
      message: 'Password and confirm password do not match.',
    };
  }

  return {
    ok: true,
    data: {
      name: trimmedName,
      niraId: trimmedNira,
      phone: trimmedPhone,
      tell: trimmedTell,
      email: trimmedEmail,
      password: rawPassword,
    },
  };
};

export const validateLoginInput = ({ email, password }) => {
  const trimmedEmail = String(email ?? '').trim().toLowerCase();
  const rawPassword = String(password ?? '');

  if (!trimmedEmail) {
    return { ok: false, message: 'Email is required.' };
  }

  if (!isValidEmail(trimmedEmail)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }

  if (!rawPassword) {
    return { ok: false, message: 'Password is required.' };
  }

  return {
    ok: true,
    data: { email: trimmedEmail, password: rawPassword },
  };
};
