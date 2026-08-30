const STATUS_GROUP_COLORS = {
  Open: '#2563eb',
  Pending: '#d97706',
  'Under Investigation': '#0ea5e9',
  Resolved: '#16a34a',
  Closed: '#475569',
};

const STATUS_GROUP_MAP = {
  Opened: 'Open',
  Assigned: 'Open',
  Reopened: 'Open',
  Pending: 'Pending',
  'Under Investigation': 'Under Investigation',
  'Investigation Completed': 'Under Investigation',
  Resolved: 'Resolved',
  Closed: 'Closed',
};

const CATEGORY_COLORS = [
  '#1e3a5f',
  '#2563eb',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#cbd5e1',
];

const TREND_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

function ChartEmpty({ message }) {
  return (
    <div className="report-chart-empty">
      <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
        <path
          fill="currentColor"
          d="M5 19V9h2v10H5zm6 0V5h2v14h-2zm6 0v-6h2v6h-2z"
        />
      </svg>
      <p>{message}</p>
    </div>
  );
}

export function OccurrenceTrendChart({
  trends = [],
  granularity = 'month',
  onGranularityChange,
  loading,
}) {
  if (loading) {
    return (
      <div className="report-chart report-chart--area">
        <div className="skeleton skeleton--chart" />
      </div>
    );
  }

  const points = trends.filter((item) => item?.count >= 0);

  return (
    <div className="report-chart report-chart--area">
      {onGranularityChange ? (
        <div className="report-chart__toggle" role="tablist" aria-label="Trend granularity">
          {TREND_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={granularity === option.value}
              className={`report-chart__toggle-btn ${
                granularity === option.value ? 'is-active' : ''
              }`}
              onClick={() => onGranularityChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      {!points.length ? (
        <ChartEmpty message="No occurrence data available for this period." />
      ) : (
        <TrendSvg points={points} granularity={granularity} />
      )}
    </div>
  );
}

function TrendSvg({ points, granularity }) {
  const width = 640;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 32, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...points.map((p) => p.count), 1);

  const coords = points.map((point, index) => {
    const x = pad.left + (index / Math.max(points.length - 1, 1)) * innerW;
    const y = pad.top + innerH - (point.count / max) * innerH;
    return { x, y, ...point };
  });

  const linePath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${pad.top + innerH} L ${coords[0].x} ${pad.top + innerH} Z`;

  const formatLabel = (label) => {
    if (!label) return '';
    if (granularity === 'day') return label.slice(5);
    if (granularity === 'week') return label.replace(/^\d+-/, '');
    return label.slice(5);
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Occurrence trends chart">
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const y = pad.top + innerH - tick * innerH;
        const value = Math.round(max * tick);
        return (
          <g key={tick}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="report-chart__grid" />
            <text x={pad.left - 8} y={y + 4} className="report-chart__axis" textAnchor="end">
              {value}
            </text>
          </g>
        );
      })}
      <path d={areaPath} className="report-chart__area" />
      <path d={linePath} className="report-chart__line" />
      {coords.map((point) => (
        <g key={`${point.label}-${point.x}`}>
          <circle cx={point.x} cy={point.y} r="4" className="report-chart__dot" />
          <text x={point.x} y={height - 8} className="report-chart__axis" textAnchor="middle">
            {formatLabel(point.label)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function groupStatuses(byStatus = []) {
  const buckets = {
    Open: 0,
    Pending: 0,
    'Under Investigation': 0,
    Resolved: 0,
    Closed: 0,
  };

  byStatus.forEach((item) => {
    const group = STATUS_GROUP_MAP[item.status] || null;
    if (group && buckets[group] !== undefined) {
      buckets[group] += item.count || 0;
    }
  });

  return Object.entries(buckets)
    .map(([status, count]) => ({ status, count }))
    .filter((item) => item.count > 0);
}

export function StatusDonutChart({ byStatus = [], loading }) {
  if (loading) {
    return (
      <div className="report-chart report-chart--donut">
        <div className="skeleton skeleton--donut" />
      </div>
    );
  }

  const rows = groupStatuses(byStatus);
  const total = rows.reduce((sum, item) => sum + item.count, 0);

  if (!total) {
    return (
      <div className="report-chart report-chart--donut">
        <ChartEmpty message="No occurrence data available for this period." />
      </div>
    );
  }

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 78;
  const stroke = 28;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = rows.map((item) => {
    const fraction = item.count / total;
    const length = fraction * circumference;
    const segment = {
      ...item,
      color: STATUS_GROUP_COLORS[item.status] || '#94a3b8',
      dasharray: `${length} ${circumference - length}`,
      dashoffset: -offset,
    };
    offset += length;
    return segment;
  });

  return (
    <div className="report-chart report-chart--donut">
      <div className="report-chart__donut-wrap">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Case status distribution">
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            <circle cx={cx} cy={cy} r={radius} className="report-chart__donut-bg" strokeWidth={stroke} fill="none" />
            {segments.map((seg) => (
              <circle
                key={seg.status}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={seg.dasharray}
                strokeDashoffset={seg.dashoffset}
                className="report-chart__donut-segment"
              />
            ))}
          </g>
          <text x={cx} y={cy - 4} textAnchor="middle" className="report-chart__donut-total">
            {total}
          </text>
          <text x={cx} y={cy + 16} textAnchor="middle" className="report-chart__donut-label">
            Total cases
          </text>
        </svg>
        <ul className="report-chart__legend">
          {segments.map((seg) => (
            <li key={seg.status}>
              <span style={{ background: seg.color }} />
              {seg.status} ({seg.count})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function CategoryBarChart({ byCategory = [], loading }) {
  if (loading) {
    return (
      <div className="report-chart report-chart--bars">
        <div className="skeleton skeleton--chart" />
      </div>
    );
  }

  const rows = byCategory.filter((item) => (item.count || 0) > 0).slice(0, 8);
  if (!rows.length) {
    return (
      <div className="report-chart report-chart--bars">
        <ChartEmpty message="No occurrence data available for this period." />
      </div>
    );
  }

  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="report-chart report-chart--bars">
      <ul className="report-bars">
        {rows.map((row, index) => {
          const pct = Math.round((row.count / max) * 100);
          return (
            <li key={row.category || index} className="report-bars__row">
              <span className="report-bars__label">{row.category || 'Other'}</span>
              <div className="report-bars__track">
                <div
                  className="report-bars__fill"
                  style={{
                    width: `${pct}%`,
                    background: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                  }}
                />
              </div>
              <span className="report-bars__value">{row.count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
