export function validateCitizenEdit(values) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const phone = String(values.phone ?? '').trim();
  const tell = String(values.tell ?? '').trim();

  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length > 30) {
    errors.name = 'Name must be at most 30 characters.';
  }

  if (!phone) {
    errors.phone = 'Phone is required.';
  }

  if (!tell) {
    errors.tell = 'Tell is required.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: { name, phone, tell },
  };
}
