import Sparkline from './Sparkline';

const TONE = {
  primary: {
    color: '#3b82f6',
    soft: 'rgba(59, 130, 246, 0.14)',
    glow: 'rgba(59, 130, 246, 0.2)',
  },
  warning: {
    color: '#f59e0b',
    soft: 'rgba(245, 158, 11, 0.15)',
    glow: 'rgba(245, 158, 11, 0.2)',
  },
  info: {
    color: '#14b8a6',
    soft: 'rgba(20, 184, 166, 0.14)',
    glow: 'rgba(20, 184, 166, 0.2)',
  },
  purple: {
    color: '#8b5cf6',
    soft: 'rgba(139, 92, 246, 0.14)',
    glow: 'rgba(139, 92, 246, 0.2)',
  },
};

const ICONS = {
  primary: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 16 11zm-8 1a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8 12zm0 2c-3 0-6 1.5-6 3.5V20h12v-2.5C14 15.5 11 14 8 14zm8 0c-.4 0-.8 0-1.2.1 1.3.8 2.2 2 2.2 3.4V20H22v-1.5c0-2-3-3.5-6-3.5z" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2h8l5 5v15H7V2zm7 1.8V8h4.2L14 3.8zM9 12h9v1.6H9V12zm0 3.2h9V17H9v-1.8z" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 4 5v6.2c0 5.1 3.5 9.8 8 11.3 4.5-1.5 8-6.2 8-11.3V5l-8-3zm0 3.1 5.2 2v4.1c0 3.5-2.2 6.7-5.2 8-3-1.3-5.2-4.5-5.2-8V7.1L12 5.1z" />
    </svg>
  ),
  purple: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.2 0-8 2.1-8 4.8V21h16v-2.2c0-2.7-3.8-4.8-8-4.8z" />
    </svg>
  ),
};

const MENU_ICON = (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <circle cx="12" cy="5" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="19" r="1.6" fill="currentColor" />
  </svg>
);

export default function DashboardSummaryCard({
  label,
  value,
  hint,
  tone = 'primary',
  series = [],
  changePct = null,
}) {
  const theme = TONE[tone] || TONE.primary;
  const hasSeries = Array.isArray(series) && series.some((point) => Number(point) > 0);

  let trendLabel = 'Current period';
  let trendClass = 'is-flat';
  if (typeof changePct === 'number') {
    if (changePct === 0) {
      trendLabel = '— 0% vs last 7 days';
      trendClass = 'is-flat';
    } else if (changePct > 0) {
      trendLabel = `↑ ${changePct}% vs last 7 days`;
      trendClass = 'is-up';
    } else {
      trendLabel = `↓ ${Math.abs(changePct)}% vs last 7 days`;
      trendClass = 'is-down';
    }
  }

  return (
    <article
      className={`dash-card dash-card--${tone}`}
      style={{
        '--dash-accent': theme.color,
        '--dash-soft': theme.soft,
        '--dash-glow': theme.glow,
      }}
    >
      <div className="dash-card__head">
        <div className="dash-card__title-row">
          <span className="dash-card__icon" aria-hidden="true">
            {ICONS[tone] || ICONS.primary}
          </span>
          <p className="dash-card__label">{label}</p>
        </div>
        <button type="button" className="dash-card__menu" aria-label={`${label} options`} disabled>
          {MENU_ICON}
        </button>
      </div>

      <p className="dash-card__value">{value ?? 0}</p>
      {hint ? <p className="dash-card__hint">{hint}</p> : null}

      <div className="dash-card__footer">
        <span className={`dash-card__trend ${trendClass}`}>{trendLabel}</span>
        <div className="dash-card__chart">
          {hasSeries ? (
            <Sparkline values={series} color={theme.color} />
          ) : (
            <span className="dash-card__chart-empty" aria-hidden="true" />
          )}
        </div>
      </div>
    </article>
  );
}
