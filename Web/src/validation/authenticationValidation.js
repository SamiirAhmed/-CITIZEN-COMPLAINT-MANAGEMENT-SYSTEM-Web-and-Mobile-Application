const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(values) {
  const errors = {};
  const email = String(values.email ?? '').trim().toLowerCase();
  const password = String(values.password ?? '');

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: { email, password },
  };
}
