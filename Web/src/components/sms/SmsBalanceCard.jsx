const REFRESH_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.96 7.96 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 9.74A7.96 7.96 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
    />
  </svg>
);

function formatBalance(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString();
}

export default function SmsBalanceCard({ balance, status, provider, loading, onRefresh }) {
  const connected = status === 'connected' && balance != null;

  return (
    <section className="sms-balance-card panel">
      <div className="sms-balance-card__header">
        <div>
          <p className="sms-balance-card__eyebrow">SMS Balance</p>
          <h2>Total SMS Remaining</h2>
        </div>
        <button
          type="button"
          className="sms-balance-card__refresh"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh SMS balance"
          title="Refresh balance"
        >
          {loading ? 'Refreshing…' : REFRESH_ICON}
        </button>
      </div>

      <div className="sms-balance-card__value" aria-live="polite">
        {loading && balance == null ? (
          <span className="sms-balance-card__skeleton" />
        ) : (
          formatBalance(balance)
        )}
      </div>

      <div className="sms-balance-card__meta">
        <span>{provider || 'Tabaarak'} SMS</span>
        <span className={`sms-balance-card__status ${connected ? 'is-connected' : 'is-unavailable'}`}>
          <span className="sms-balance-card__dot" aria-hidden="true" />
          {connected ? 'Connected' : 'Unavailable'}
        </span>
      </div>
    </section>
  );
}
