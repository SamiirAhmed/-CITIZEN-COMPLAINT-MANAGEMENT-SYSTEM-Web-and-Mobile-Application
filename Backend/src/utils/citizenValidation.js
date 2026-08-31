/** Practical email check — requires local@domain.tld (rejects admin@gmail). */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

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
  region,
  district,
}) => {
  const trimmedName = String(name ?? '').trim();
  const trimmedNira = String(niraId ?? '').trim();
  const trimmedPhone = String(phone ?? '').trim();
  const trimmedTell = String(tell ?? '').trim();
  const trimmedEmail = String(email ?? '').trim().toLowerCase();
  const rawPassword = String(password ?? '');
  const trimmedDistrict = String(district ?? '').trim();
  const trimmedRegion = String(region ?? '').trim();

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
      message: 'Passwords do not match.',
    };
  }

  if (!trimmedDistrict) {
    return { ok: false, message: 'Please select a district.' };
  }

  return {
    ok: true,
    data: {
      name: trimmedName,
      niraId: trimmedNira,
      phone: trimmedPhone,
      tell: trimmedTell || '',
      email: trimmedEmail,
      password: rawPassword,
      region: trimmedRegion,
      district: trimmedDistrict,
    },
  };
};

export const validateLoginInput = ({ email, phone, password, identifier }) => {
  const rawPassword = String(password ?? '');
  const rawIdentifier = String(identifier ?? email ?? phone ?? '').trim();

  if (!rawIdentifier) {
    return { ok: false, message: 'Email or mobile number is required.' };
  }

  if (!rawPassword) {
    return { ok: false, message: 'Password is required.' };
  }

  return {
    ok: true,
    data: { identifier: rawIdentifier, password: rawPassword },
  };
};
