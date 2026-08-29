const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePoliceRegistration(values) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const niraId = String(values.niraId ?? '').trim();
  const phone = String(values.phone ?? '').trim();
  const tell = String(values.tell ?? '').trim();
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
    errors.phone = 'Phone is required.';
  }

  if (!tell) {
    errors.tell = 'Tell is required.';
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

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      niraId,
      phone,
      tell,
      email,
      password,
      confirmPassword,
      badgeNumber,
      station,
    },
  };
}

export function validateStaffUserEdit(values) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const phone = String(values.phone ?? '').trim();
  const tell = String(values.tell ?? '').trim();
  const badgeNumber = String(values.badgeNumber ?? '').trim();
  const station = String(values.station ?? '').trim();

  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length > 30) {
    errors.name = 'Name must be at most 30 characters.';
  }

  if (!phone) {
    errors.phone = 'Phone is required.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: { name, phone, tell, badgeNumber, station },
  };
}
