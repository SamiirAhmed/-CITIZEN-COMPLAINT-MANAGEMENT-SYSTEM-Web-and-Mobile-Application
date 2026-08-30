function dash(value) {
  const text = String(value ?? '').trim();
  return text || '—';
}

function statusLabel(status) {
  if (status === 'success') return 'Sent';
  if (status === 'partial') return 'Partially Sent';
  if (status === 'pending') return 'Pending';
  return 'Failed';
}

function statusClass(status) {
  if (status === 'success') return 'status-pill--success';
  if (status === 'partial') return 'status-pill--warning';
  if (status === 'pending') return 'status-pill--pending';
  return 'status-pill--failed';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function recipientSummary(record) {
  const names = (record.recipients || []).map((item) => item.name).filter(Boolean);
  if (!names.length) {
    const count = Number(record.recipientCount) || 0;
    return count ? `${count} Police user${count === 1 ? '' : 's'}` : '—';
  }
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

function recipientError(record) {
  return (record.recipients || []).map((item) => item.error).filter(Boolean)[0] || '';
}

export default function SmsHistoryTable({ records, loading }) {
  if (loading) {
    return (
      <div className="sms-table-skeleton">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton skeleton--row" />
        ))}
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="sms-empty-state">
        <h3>No SMS history available</h3>
        <p>Sent SMS records will appear here.</p>
      </div>
    );
  }

  return (
    <div className="sms-history-scroll">
      <table className="data-table sms-history-table">
        <thead>
          <tr>
            <th>Msg No</th>
            <th>Sender</th>
            <th>Recipients</th>
            <th>Title</th>
            <th>Message</th>
            <th>Status</th>
            <th>Sent At</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const error = recipientError(record);
            const count = Number(record.recipientCount) || 0;
            const names = (record.recipients || []).map((item) => item.name).filter(Boolean);
            return (
              <tr key={record.id}>
                <td className="sms-history-table__no">
                  {dash(record.displayNo || record.msgNo)}
                </td>
                <td className="cell-name">{dash(record.actorName)}</td>
                <td className="sms-history-table__recipients">
                  <span className="sms-history-table__names" title={names.join(', ') || undefined}>
                    {recipientSummary(record)}
                  </span>
                  {count > 1 ? (
                    <span className="cell-muted">
                      {count} Police users
                    </span>
                  ) : null}
                </td>
                <td className="sms-history-table__title">{dash(record.title)}</td>
                <td>
                  <p className="sms-history-table__message" title={record.message || undefined}>
                    {dash(record.messagePreview || record.message)}
                  </p>
                </td>
                <td>
                  <span
                    className={`status-pill ${statusClass(record.status)}`}
                    title={error || undefined}
                  >
                    {statusLabel(record.status)}
                  </span>
                </td>
                <td className="sms-history-table__date">{formatDate(record.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
