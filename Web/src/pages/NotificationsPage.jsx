import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../context/AuthContext';
import { resolveNotificationPath } from '../navigation/adminNavigation';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';

function formatRelative(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
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

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications({
        limit: 100,
        filter: filter === 'all' ? '' : filter,
        search,
      });
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 200);
    return () => clearTimeout(timer);
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
    setBusy(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.message || 'Unable to mark notifications as read.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>Notifications</h2>
            <p className="muted">
              {user?.role === 'police'
                ? 'Account, assignment, and case updates for your Police portal.'
                : 'Citizen, complaint, OB, and staff events across the SPO portal.'}
            </p>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={handleMarkAll}
              disabled={busy}
            >
              {busy ? 'Updating…' : 'Mark all as read'}
            </button>
          ) : null}
        </div>

        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search notifications"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        {loading ? (
          <LoadingState message="Loading notifications…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !items.length ? (
          <EmptyState
            title="No notifications"
            description="Important system events will appear here."
          />
        ) : (
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
                    <em>{formatRelative(item.createdAt)}</em>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
