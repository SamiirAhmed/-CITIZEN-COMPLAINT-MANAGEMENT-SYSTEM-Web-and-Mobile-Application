function formatValue(value, loading) {
  if (loading) return '—';
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-8 1a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8 12zm8 2c-3.2 0-6 1.5-6 3.3V19h12v-1.7c0-1.8-2.8-3.3-6-3.3zM8 15c-.3 0-.7 0-1 .1C4.6 15.5 3 16.6 3 18v1h5v-1.7c0-.8.3-1.5.8-2.1A8.7 8.7 0 0 0 8 15z"
      />
    </svg>
  );
}

function ActiveIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="M2 21 23 12 2 3v7l15 2-15 2z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"
      />
    </svg>
  );
}

export default function SmsStatCards({
  policeTotal,
  policeActive,
  balance,
  balanceStatus,
  balanceLoading,
  accountType,
  historyCount,
  onRefreshBalance,
}) {
  const connected = balanceStatus === 'connected' && balance != null;

  return (
    <section className="sms-stat-grid" aria-label="SMS portal statistics">
      <article className="sms-stat-card">
        <span className="sms-stat-card__icon sms-stat-card__icon--blue">
          <UsersIcon />
        </span>
        <div>
          <p className="sms-stat-card__label">Total Police Users</p>
          <p className="sms-stat-card__value">{formatValue(policeTotal, false)}</p>
        </div>
      </article>

      <article className="sms-stat-card">
        <span className="sms-stat-card__icon sms-stat-card__icon--green">
          <ActiveIcon />
        </span>
        <div>
          <p className="sms-stat-card__label">Active Police Users</p>
          <p className="sms-stat-card__value">{formatValue(policeActive, false)}</p>
        </div>
      </article>

      <article className="sms-stat-card sms-stat-card--balance">
        <span className="sms-stat-card__icon sms-stat-card__icon--purple">
          <SendIcon />
        </span>
        <div className="sms-stat-card__body">
          <p className="sms-stat-card__label">SMS Balance</p>
          <p className="sms-stat-card__value">
            {balanceLoading ? 'Refreshing...' : formatValue(balance, false)}
          </p>
          <p className="sms-stat-card__meta">
            {connected
              ? `${accountType || 'Prepaid'} · Live`
              : 'Tabaarak · Unavailable'}
          </p>
        </div>
        <button
          type="button"
          className="sms-stat-card__refresh"
          onClick={onRefreshBalance}
          disabled={balanceLoading}
        >
          {balanceLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </article>

      <article className="sms-stat-card">
        <span className="sms-stat-card__icon sms-stat-card__icon--orange">
          <HistoryIcon />
        </span>
        <div>
          <p className="sms-stat-card__label">Message History</p>
          <p className="sms-stat-card__value">{formatValue(historyCount, false)}</p>
        </div>
      </article>
    </section>
  );
}
