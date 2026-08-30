const STATUS_COLORS = {
  Submitted: '#0b3d91',
  'Under Review': '#c47a12',
  Verified: '#0f766e',
  Rejected: '#b91c1c',
  Resolved: '#15803d',
  Closed: '#64748b',
  'OB Created': '#1d4ed8',
  'Under Investigation': '#7c3aed',
  'Investigation Completed': '#0369a1',
  Reopened: '#b45309',
};

const FALLBACK = ['#0b3d91', '#c47a12', '#0f766e', '#15803d', '#b91c1c', '#64748b', '#1d4ed8'];

export default function ComplaintStatusChart({ items = [], total = 0 }) {
  const size = 148;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = items.map((item, index) => {
    const ratio = total > 0 ? item.count / total : 0;
    const length = ratio * circumference;
    const segment = {
      ...item,
      color: STATUS_COLORS[item.status] || FALLBACK[index % FALLBACK.length],
      dasharray: `${length} ${circumference - length}`,
      dashoffset: -offset,
    };
    offset += length;
    return segment;
  });

  return (
    <article className="panel dash-panel">
      <div className="panel__header panel__header--spread">
        <div>
          <h2>Complaint Status</h2>
          <p className="muted">Live counts from the database.</p>
        </div>
      </div>

      {!items.length || total === 0 ? (
        <div className="donut-empty">
          <strong>0</strong>
          <span className="muted">No complaints recorded yet.</span>
        </div>
      ) : (
        <div className="donut-layout">
          <div className="donut-chart">
            <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#eef2f7"
                strokeWidth={stroke}
              />
              {segments.map((item) => (
                <circle
                  key={item.status}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={stroke}
                  strokeDasharray={item.dasharray}
                  strokeDashoffset={item.dashoffset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              ))}
            </svg>
            <div className="donut-chart__center">
              <strong>{total}</strong>
              <span>Total</span>
            </div>
          </div>
          <ul className="donut-legend">
            {segments.map((item) => (
              <li key={item.status}>
                <span className="donut-legend__swatch" style={{ background: item.color }} />
                <span className="donut-legend__label">{item.status}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
