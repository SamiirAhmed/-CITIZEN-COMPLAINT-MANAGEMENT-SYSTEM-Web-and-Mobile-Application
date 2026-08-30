const ICONS = {
  total: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" fill="currentColor" />
    </svg>
  ),
  open: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.9V17h-2v-1.1a3 3 0 1 1 2 0z" fill="currentColor" />
    </svg>
  ),
  pending: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 5v5.6l3.5 2.1-.9 1.5L11 13V7h2z" fill="currentColor" />
    </svg>
  ),
  resolved: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1.3 13.3-3.6-3.6 1.4-1.4 2.2 2.2 5.4-5.4 1.4 1.4-6.8 6.8z" fill="currentColor" />
    </svg>
  ),
  closed: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h9l5 5v15H6V2zm8 1.5V8h4.5L14 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" fill="currentColor" />
    </svg>
  ),
};

export default function ReportStatCard({
  label,
  value,
  description,
  changePct,
  icon = 'total',
  tone = 'navy',
  loading = false,
}) {
  const trendUp = typeof changePct === 'number' && changePct > 0;
  const trendDown = typeof changePct === 'number' && changePct < 0;
  const trendFlat = typeof changePct === 'number' && changePct === 0;

  let trendText = 'No prior period data';
  if (typeof changePct === 'number') {
    if (trendFlat) trendText = '0% vs previous period';
    else if (trendUp) trendText = `+${changePct}% vs previous period`;
    else trendText = `${changePct}% vs previous period`;
  }

  return (
    <article className={`report-stat report-stat--${tone} ${loading ? 'is-loading' : ''}`}>
      {loading ? (
        <div className="report-stat__skeleton" aria-hidden="true">
          <div className="skeleton skeleton--sm" />
          <div className="skeleton skeleton--lg" />
          <div className="skeleton skeleton--md" />
        </div>
      ) : (
        <>
          <div className="report-stat__top">
            <span className="report-stat__icon">{ICONS[icon] || ICONS.total}</span>
            <p className="report-stat__label">{label}</p>
          </div>
          <p className="report-stat__value">{value ?? 0}</p>
          <p className="report-stat__desc">{description}</p>
          <div className="report-stat__footer">
            <span
              className={`report-stat__trend ${
                trendUp ? 'is-up' : trendDown ? 'is-down' : 'is-flat'
              }`}
            >
              {trendUp ? '↑ ' : trendDown ? '↓ ' : ''}
              {trendText}
            </span>
          </div>
        </>
      )}
    </article>
  );
}
