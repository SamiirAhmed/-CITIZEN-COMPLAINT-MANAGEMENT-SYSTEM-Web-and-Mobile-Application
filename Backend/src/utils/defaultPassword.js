/** Read default staff password from environment — never expose to clients. */
export function getDefaultUserPassword() {
  const value = process.env.DEFAULT_USER_PASSWORD;
  if (!value || String(value).trim().length < 8) {
    throw new Error(
      'DEFAULT_USER_PASSWORD is missing or invalid. Set it in Backend .env (minimum 8 characters).'
    );
  }
  return String(value);
}
