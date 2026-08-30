function formatRelative(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

export default function SystemAlerts({ alerts = [] }) {
  return (
    <article className="panel dash-panel">
      <div className="panel__header">
        <div>
          <h2>System Alerts</h2>
          <p className="muted">Latest live system updates.</p>
        </div>
      </div>

      {!alerts.length ? (
        <p className="muted chart-empty">No system alerts right now.</p>
      ) : (
        <ul className="alert-feed">
          {alerts.map((alert) => (
            <li key={alert.id} className={`alert-feed__item alert-feed__item--${alert.type}`}>
              <span className="alert-feed__dot" aria-hidden="true" />
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.detail}</p>
              </div>
              <em>{formatRelative(alert.createdAt)}</em>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
