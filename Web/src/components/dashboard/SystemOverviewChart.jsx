function buildLine(values, width, height, max) {
  if (!values?.length) return '';
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / max) * (height - 12) - 6;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

const SERIES = [
  { key: 'citizens', label: 'Citizens', color: '#0b3d91' },
  { key: 'complaints', label: 'Complaints', color: '#c47a12' },
  { key: 'obRecords', label: 'OB Records', color: '#0f766e' },
];

export default function SystemOverviewChart({ overview }) {
  const labels = overview?.labels || [];
  const width = 560;
  const height = 160;
  const max = Math.max(
    1,
    ...(overview?.citizens || []),
    ...(overview?.complaints || []),
    ...(overview?.obRecords || [])
  );

  const hasData =
    (overview?.citizens || []).some((n) => n > 0) ||
    (overview?.complaints || []).some((n) => n > 0) ||
    (overview?.obRecords || []).some((n) => n > 0);

  return (
    <article className="panel dash-panel">
      <div className="panel__header panel__header--spread">
        <div>
          <h2>System Overview</h2>
          <p className="muted">Live activity for the last 7 days.</p>
        </div>
        <span className="chip chip--gold">This week</span>
      </div>

      {!hasData ? (
        <p className="muted chart-empty">No weekly activity recorded yet.</p>
      ) : (
        <>
          <div className="chart-legend">
            {SERIES.map((item) => (
              <span key={item.key} className="chart-legend__item">
                <i style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
          <div className="line-chart">
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weekly system overview">
              {[0.25, 0.5, 0.75, 1].map((ratio) => (
                <line
                  key={ratio}
                  x1="0"
                  x2={width}
                  y1={height - ratio * (height - 12) - 6}
                  y2={height - ratio * (height - 12) - 6}
                  stroke="#e8eef5"
                  strokeDasharray="4 6"
                />
              ))}
              {SERIES.map((item) => (
                <path
                  key={item.key}
                  d={buildLine(overview?.[item.key] || [], width, height, max)}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
            <div className="line-chart__labels">
              {labels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </article>
  );
}
