import ProfileAvatar from '../common/ProfileAvatar';

function StatusBadge({ active }) {
  return (
    <span className={`status-pill ${active ? 'status-pill--success' : 'status-pill--muted'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function normalizeSomaliMobile(phone = '') {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('00252')) digits = digits.slice(5);
  else if (digits.startsWith('252')) digits = digits.slice(3);
  digits = digits.replace(/^0+/, '');
  return digits;
}

function hasValidPhone(phone = '') {
  return /^[67]\d{7,8}$/.test(normalizeSomaliMobile(phone));
}

export default function PoliceRecipientTable({
  records,
  selectedIds,
  loading,
  onToggle,
  onToggleAll,
}) {
  const selectable = records.filter((record) => hasValidPhone(record.phone));
  const allSelected =
    selectable.length > 0 && selectable.every((record) => selectedIds.has(record.id));

  if (loading) {
    return (
      <div className="sms-table-skeleton">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton skeleton--row" />
        ))}
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="sms-empty-state">
        <h3>No Police users found</h3>
        <p>No Police users match your search.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table data-table--compact sms-recipient-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                aria-label="Select all Police users with valid phones on this page"
                onChange={(event) => onToggleAll(event.target.checked, selectable)}
              />
            </th>
            <th>Image</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Badge</th>
            <th>Station</th>
            <th>District</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const selected = selectedIds.has(record.id);
            const validPhone = hasValidPhone(record.phone);
            return (
              <tr key={record.id} className={selected ? 'is-selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={!validPhone}
                    aria-label={`Select ${record.name}`}
                    onChange={() => onToggle(record)}
                  />
                </td>
                <td>
                  <ProfileAvatar
                    name={record.name}
                    src={record.profileImage}
                    size={36}
                    previewable={false}
                  />
                </td>
                <td className="cell-name">{record.name}</td>
                <td>
                  {record.phone || '—'}
                  {!validPhone ? (
                    <div className="cell-muted">Invalid phone</div>
                  ) : null}
                </td>
                <td>{record.badgeNumber || '—'}</td>
                <td>{record.station || '—'}</td>
                <td>{record.district || '—'}</td>
                <td>
                  <StatusBadge active={record.isActive !== false} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
