import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getSecurityAlerts,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';

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
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function formatAlertTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'successful', label: 'Successful' },
  { id: 'failed', label: 'Failed' },
  { id: 'logout', label: 'Logout' },
  { id: 'security', label: 'Security' },
];

const DATE_OPTIONS = [
  { id: '', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'last_30_days', label: 'Last 30 Days' },
];

function mapAlertType(alert) {
  if (alert.type === 'failed' || alert.status === 'failed') return 'failed';
  if (alert.type === 'security' || alert.alertAction === 'SECURITY_ALERT') return 'security';
  if (alert.type === 'logout') return 'logout';
  if (alert.type === 'password') return 'password';
  return 'success';
}

function AlertStatusDot({ type }) {
  const className =
    type === 'failed'
      ? 'alert-feed__dot alert-feed__dot--failed'
      : type === 'security'
        ? 'alert-feed__dot alert-feed__dot--security'
        : type === 'logout'
          ? 'alert-feed__dot alert-feed__dot--logout'
          : type === 'password'
            ? 'alert-feed__dot alert-feed__dot--password'
            : 'alert-feed__dot alert-feed__dot--success';
  return <span className={className} aria-hidden="true" />;
}

export default function SystemAlerts({
  alerts: initialAlerts = [],
  unreadCount: initialUnread = 0,
  loadFromApi = false,
  compact = true,
}) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [filter, setFilter] = useState('all');
  const [range, setRange] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!loadFromApi) return;
    setLoading(true);
    try {
      const result = await getSecurityAlerts({
        filter,
        range,
        search,
        limit: compact ? 8 : 25,
      });
      setAlerts(
        (result.notifications || []).map((item) => ({
          id: item.id,
          type: mapAlertType(item),
          alertAction: item.alertAction,
          status: item.status,
          title: item.title,
          detail: item.message,
          actorName: item.actorName,
          actorRole: item.actorRole,
          email: item.email,
          failureReason: item.failureReason,
          ipAddress: item.ipAddress,
          accessSource: item.accessSource,
          isRead: item.isRead,
          createdAt: item.createdAt,
        }))
      );
      setUnreadCount(result.unreadCount || 0);
    } catch {
      // Keep existing alerts on failure.
    } finally {
      setLoading(false);
    }
  }, [compact, filter, loadFromApi, range, search]);

  useEffect(() => {
    if (!loadFromApi) {
      setAlerts(initialAlerts);
      setUnreadCount(initialUnread);
      return;
    }
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [initialAlerts, initialUnread, load, loadFromApi]);

  const visibleAlerts = useMemo(() => {
    if (loadFromApi) return alerts;
    return alerts.filter((alert) => {
      const type = mapAlertType(alert);
      if (filter === 'successful') return type === 'success';
      if (filter === 'failed') return type === 'failed';
      if (filter === 'logout') return type === 'logout';
      if (filter === 'security') return type === 'security';
      return true;
    });
  }, [alerts, filter, loadFromApi]);

  const handleAlertOpen = async (alert) => {
    if (!alert.isRead && alert.id) {
      try {
        await markNotificationRead(alert.id);
        setAlerts((current) =>
          current.map((item) =>
            item.id === alert.id ? { ...item, isRead: true } : item
          )
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Non-blocking.
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead({ securityOnly: true });
      setAlerts((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Non-blocking.
    }
  };

  return (
    <article className="panel dash-panel system-alerts">
      <div className="panel__header panel__header--spread">
        <div>
          <h2>System Alerts</h2>
          <p className="muted">Real login and security events from the Backend.</p>
        </div>
        <div className="system-alerts__meta">
          {unreadCount > 0 ? (
            <span className="system-alerts__count">{unreadCount} unread</span>
          ) : null}
          {unreadCount > 0 ? (
            <button type="button" className="btn btn--ghost btn--small" onClick={handleMarkAllRead}>
              Mark all read
            </button>
          ) : null}
          <Link to="/audit-logs" className="btn btn--ghost btn--small">
            Audit Logs
          </Link>
        </div>
      </div>

      <div className="system-alerts__filters">
        <div className="chip-row" role="tablist" aria-label="Alert filters">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={filter === option.id}
              className={`chip ${filter === option.id ? 'chip--active' : ''}`}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {loadFromApi ? (
          <div className="system-alerts__filter-row">
            <select value={range} onChange={(event) => setRange(event.target.value)}>
              {DATE_OPTIONS.map((option) => (
                <option key={option.id || 'all'} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search user, email, IP…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        ) : null}
      </div>

      {loading ? <p className="muted chart-empty">Loading alerts…</p> : null}

      {!loading && !visibleAlerts.length ? (
        <p className="muted chart-empty">No system alerts for the selected filters.</p>
      ) : (
        <ul className="alert-feed">
          {visibleAlerts.map((alert) => {
            const type = mapAlertType(alert);
            return (
              <li
                key={alert.id}
                className={`alert-feed__item alert-feed__item--${type} ${alert.isRead ? 'is-read' : 'is-unread'}`}
              >
                <AlertStatusDot type={type} />
                <button
                  type="button"
                  className="alert-feed__body"
                  onClick={() => handleAlertOpen(alert)}
                >
                  <strong>{alert.title}</strong>
                  <p>{alert.detail}</p>
                  <div className="alert-feed__meta">
                    {alert.actorName ? <span>{alert.actorName}</span> : null}
                    {alert.actorRole ? <span>{alert.actorRole}</span> : null}
                    {alert.email && !alert.actorName ? <span>{alert.email}</span> : null}
                    {alert.failureReason ? <span>{alert.failureReason}</span> : null}
                  </div>
                </button>
                <em>{formatRelative(alert.createdAt) || formatAlertTime(alert.createdAt)}</em>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
