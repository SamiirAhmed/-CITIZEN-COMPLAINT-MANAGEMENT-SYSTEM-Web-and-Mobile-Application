import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resolveNotificationPath } from '../../navigation/adminNavigation';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

const DATE_OPTIONS = [
  { id: '', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'last_30_days', label: 'Last 30 Days' },
];

const SKELETON_ROWS = 6;

function formatRelative(value, nowMs) {
  if (!value) return '';
  try {
    const date = new Date(value);
    const diffMs = nowMs - date.getTime();
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

/** Isolated relative-time tick — does not remount parent alert list. */
const RelativeTime = memo(function RelativeTime({ value }) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  return <em className="alert-feed__time">{formatRelative(value, nowMs)}</em>;
});

function mapAlertType(alert) {
  const type = String(alert.type || alert.alertAction || '').toLowerCase();
  if (type.includes('reject') || type.includes('fail') || type.includes('deactivat')) {
    return 'failed';
  }
  if (type.includes('assigned') || type.includes('permission') || type.includes('status')) {
    return 'security';
  }
  return 'success';
}

function normalizeAlert(item) {
  return {
    id: item.id,
    type: item.type || mapAlertType(item),
    alertAction: item.alertAction || item.type,
    status: item.status,
    title: item.title,
    detail: item.detail || item.message,
    message: item.message || item.detail,
    actorName: item.actorName,
    actorRole: item.actorRole,
    email: item.email,
    failureReason: item.failureReason,
    ipAddress: item.ipAddress,
    accessSource: item.accessSource,
    isRead: Boolean(item.isRead),
    createdAt: item.createdAt,
    linkPath: item.linkPath,
    relatedUser: item.relatedUser,
    relatedComplaint: item.relatedComplaint,
    relatedOB: item.relatedOB,
  };
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

const AlertRow = memo(function AlertRow({ alert, onOpen }) {
  const type = mapAlertType(alert);
  return (
    <li
      className={`alert-feed__item alert-feed__item--${type} ${
        alert.isRead ? 'is-read' : 'is-unread'
      }`}
    >
      <AlertStatusDot type={type} />
      <button type="button" className="alert-feed__body" onClick={() => onOpen(alert)}>
        <strong>{alert.title}</strong>
        <p>{alert.detail || alert.message}</p>
        <div className="alert-feed__meta">
          {alert.actorName ? <span>{alert.actorName}</span> : null}
          {alert.actorRole ? <span>{alert.actorRole}</span> : null}
          {alert.email && !alert.actorName ? <span>{alert.email}</span> : null}
          {alert.failureReason ? <span>{alert.failureReason}</span> : null}
        </div>
      </button>
      <RelativeTime value={alert.createdAt} />
    </li>
  );
});

function AlertSkeleton() {
  return (
    <ul className="alert-feed alert-feed--skeleton" aria-hidden="true">
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <li key={`skeleton-${index}`} className="alert-feed__item alert-feed__item--skeleton">
          <span className="alert-feed__dot alert-feed__dot--skeleton" />
          <div className="alert-feed__skeleton-body">
            <span className="skel skel--title" />
            <span className="skel skel--line" />
            <span className="skel skel--meta" />
          </div>
          <span className="skel skel--time" />
        </li>
      ))}
    </ul>
  );
}

export default function SystemAlerts({
  alerts: initialAlerts = [],
  unreadCount: initialUnread = 0,
  loadFromApi = true,
  compact = true,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const listRef = useRef(null);
  const requestIdRef = useRef(0);
  const seededRef = useRef(false);

  const [alerts, setAlerts] = useState(() =>
    (initialAlerts || []).map(normalizeAlert)
  );
  const [unreadCount, setUnreadCount] = useState(initialUnread || 0);
  const [filter, setFilter] = useState('all');
  const [range, setRange] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(Boolean(loadFromApi) && !(initialAlerts || []).length);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');


  // Debounce search so keystrokes do not refetch / jump the list.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Seed once from dashboard props without re-syncing on every parent render.
  useEffect(() => {
    if (loadFromApi || seededRef.current) return;
    if ((initialAlerts || []).length) {
      setAlerts(initialAlerts.map(normalizeAlert));
      setUnreadCount(initialUnread || 0);
      seededRef.current = true;
      setLoading(false);
    }
  }, [initialAlerts, initialUnread, loadFromApi]);

  const load = useCallback(
    async ({ soft = false } = {}) => {
      if (!loadFromApi) return;
      const requestId = ++requestIdRef.current;
      if (soft) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const result = await getNotifications({
          filter: filter === 'unread' ? 'unread' : '',
          range,
          search: debouncedSearch,
          limit: compact ? 8 : 25,
        });
        if (requestId !== requestIdRef.current) return;

        const next = (result.notifications || []).map(normalizeAlert);
        const scrollTop = listRef.current?.scrollTop ?? 0;
        setAlerts(next);
        setUnreadCount(result.unreadCount || 0);

        // Restore scroll after paint so soft refresh does not jump.
        requestAnimationFrame(() => {
          if (listRef.current) {
            listRef.current.scrollTop = scrollTop;
          }
        });
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err.message || 'Unable to load system alerts.');
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [compact, debouncedSearch, filter, loadFromApi, range]
  );

  useEffect(() => {
    if (!loadFromApi) return undefined;
    const hasRows = alerts.length > 0;
    const timer = setTimeout(() => load({ soft: hasRows }), 0);
    return () => clearTimeout(timer);
    // Intentionally exclude alerts.length from deps — only refetch on filter/search/range.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, loadFromApi]);

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
    const path = resolveNotificationPath(alert, user);
    if (path) navigate(path);
  };

  const handleMarkAllRead = async () => {
    if (!unreadCount) return;
    const scrollTop = listRef.current?.scrollTop ?? 0;
    try {
      await markAllNotificationsRead();
      setAlerts((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = scrollTop;
      });
    } catch {
      // Non-blocking.
    }
  };

  const showSkeleton = loading && !alerts.length;
  const showEmpty = !loading && !error && !alerts.length;

  return (
    <article className="panel dash-panel system-alerts">
      <div className="panel__header panel__header--spread system-alerts__header">
        <div className="system-alerts__heading">
          <h2>System Alerts</h2>
          <p className="muted">Important citizen, complaint, and OB events.</p>
        </div>
        <div className="system-alerts__meta">
          <span
            className={`system-alerts__count ${unreadCount ? '' : 'is-zero'}`}
            aria-live="polite"
          >
            {unreadCount} unread
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={handleMarkAllRead}
            disabled={!unreadCount}
          >
            Mark all read
          </button>
          <Link to="/notifications" className="btn btn--ghost btn--small">
            View All
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
            <select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              aria-label="Alert date range"
            >
              {DATE_OPTIONS.map((option) => (
                <option key={option.id || 'all'} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search alerts…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Search alerts"
            />
          </div>
        ) : null}
      </div>

      <div
        className={`system-alerts__results ${refreshing ? 'is-refreshing' : ''}`}
        ref={listRef}
      >
        {showSkeleton ? <AlertSkeleton /> : null}

        {error && !showSkeleton ? (
          <div className="system-alerts__state">
            <p>Unable to load system alerts.</p>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => load({ soft: Boolean(alerts.length) })}
            >
              Retry
            </button>
          </div>
        ) : null}

        {showEmpty ? (
          <div className="system-alerts__state">
            <strong>No system alerts</strong>
            <p className="muted">There are currently no alerts to display.</p>
          </div>
        ) : null}

        {!showSkeleton && !error && alerts.length ? (
          <ul className="alert-feed">
            {alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onOpen={handleAlertOpen} />
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
