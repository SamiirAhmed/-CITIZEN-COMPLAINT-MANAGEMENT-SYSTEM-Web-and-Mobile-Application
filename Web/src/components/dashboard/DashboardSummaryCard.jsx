export default function DashboardSummaryCard({ label, value, hint, tone = 'primary' }) {
  return (
    <article className={`summary-card summary-card--${tone}`}>
      <p className="summary-card__label">{label}</p>
      <p className="summary-card__value">{value ?? 0}</p>
      {hint ? <p className="summary-card__hint">{hint}</p> : null}
    </article>
  );
}
