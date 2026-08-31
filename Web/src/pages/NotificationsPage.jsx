import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { useAuth } from '../context/AuthContext';
import { resolveNotificationPath } from '../navigation/adminNavigation';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';

function formatRelative(value, nowMs = Date.now()) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    const diffMs = nowMs - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function iconKind(type = '') {
  const value = String(type).toLowerCase();
  if (value.includes('citizen')) return 'citizen';
  if (value.includes('complaint')) return 'complaint';
  if (value.includes('investigation') || value.includes('evidence')) return 'status';
  if (value.includes('ob') || value.includes('case') || value.includes('assigned')) return 'ob';
  if (value.includes('police') || value.includes('permission') || value.includes('account') || value.includes('staff')) {
    return 'police';
  }
  if (value.includes('login') || value.includes('logout') || value.includes('security') || value.includes('password')) {
    return 'security';
  }
  if (value.includes('sms')) return 'sms';
  return 'info';
}

function NotificationsSkeleton() {
  return (
    <ul className="notification-page-list notification-page-list--skeleton" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={`notif-skel-${index}`} className="notification-item notification-item--skeleton">
          <span className="notification-item__icon skel skel--icon" />
          <span className="notification-item__body">
            <span className="skel skel--title" />
            <span className="skel skel--line" />
            <span className="skel skel--meta" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const listRef = useRef(null);
  const requestIdRef = useRef(0);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async ({ soft = false } = {}) => {
    const requestId = ++requestIdRef.current;
    if (soft) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await getNotifications({
        limit: 100,
        filter: filter === 'all' ? '' : filter,
        search: debouncedSearch,
      });
      if (requestId !== requestIdRef.current) return;
      const scrollTop = listRef.current?.scrollTop ?? 0;
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = scrollTop;
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || 'Unable to load notifications.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [debouncedSearch, filter]);

  useEffect(() => {
    const soft = items.length > 0;
    const timer = setTimeout(() => load({ soft }), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const handleOpen = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        setItems((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Continue to the related record even if mark-read fails.
      }
    }
    navigate(resolveNotificationPath(notification, user));
  };

  const handleMarkAll = async () => {
    if (!unreadCount) return;
    setBusy(true);
    const scrollTop = listRef.current?.scrollTop ?? 0;
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = scrollTop;
      });
    } catch (err) {
      setError(err.message || 'Unable to mark notifications as read.');
    } finally {
      setBusy(false);
    }
  };

  const showSkeleton = loading && !items.length;

  return (
    <div className="page-stack">
      <section className="panel notifications-panel">
        <div className="panel__header panel__header--spread notifications-panel__header">
          <div>
            <h2>Notifications</h2>
            <p className="muted">
              {user?.role === 'police'
                ? 'Account, assignment, and case updates for your Police portal.'
                : 'Citizen, complaint, OB, and staff events across the SPO portal.'}
            </p>
          </div>
          <div className="notifications-panel__meta">
            <span
              className={`system-alerts__count ${unreadCount ? '' : 'is-zero'}`}
              aria-live="polite"
            >
              {unreadCount} unread
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={handleMarkAll}
              disabled={busy || !unreadCount}
            >
              {busy ? 'Updating…' : 'Mark all as read'}
            </button>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search notifications"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        <div
          className={`notifications-panel__results ${refreshing ? 'is-refreshing' : ''}`}
          ref={listRef}
        >
          {showSkeleton ? <NotificationsSkeleton /> : null}

          {error && !showSkeleton ? (
            <ErrorState message={error} onRetry={() => load({ soft: Boolean(items.length) })} />
          ) : null}

          {!loading && !error && !items.length ? (
            <EmptyState
              title="No notifications"
              description="Important system events will appear here."
            />
          ) : null}

          {!showSkeleton && !error && items.length ? (
            <ul className="notification-page-list">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notification-item ${item.isRead ? '' : 'is-unread'}`}
                    onClick={() => handleOpen(item)}
                  >
                    <span
                      className={`notification-item__icon notification-item__icon--${iconKind(item.type)}`}
                      aria-hidden="true"
                    />
                    <span className="notification-item__body">
                      <strong>{item.title}</strong>
                      <span>{item.message}</span>
                      <em>{formatRelative(item.createdAt, nowMs)}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </div>
  );
}
