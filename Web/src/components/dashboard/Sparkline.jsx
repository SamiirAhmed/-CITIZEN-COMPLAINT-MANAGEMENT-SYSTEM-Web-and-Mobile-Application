function buildPoints(values, width, height) {
  if (!values?.length) return [];
  const max = Math.max(...values, 1);
  return values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - (value / max) * (height - 6) - 3;
    return { x, y };
  });
}

export default function Sparkline({ values = [], color = '#3b82f6' }) {
  const width = 84;
  const height = 28;
  const points = buildPoints(values, width, height);
  const hasData = values.some((value) => Number(value) > 0);

  if (!hasData || points.length < 2) return null;

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' ');

  const area = `${line} L${width},${height} L0,${height} Z`;
  const gradientId = `spark-${color.replace('#', '')}-${Math.abs(
    values.reduce((sum, value, index) => sum + Number(value) * (index + 1), 0)
  )}`;

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
