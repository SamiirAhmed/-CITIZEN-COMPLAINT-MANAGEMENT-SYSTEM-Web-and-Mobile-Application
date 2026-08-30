import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { resolveNotificationPath } from '../../navigation/adminNavigation';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';
import { formatDateTime } from './policeFormat';

export default function PoliceNotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications();
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
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
            <p className="muted">Assignment alerts and investigation updates for your account.</p>
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

        {loading ? (
          <LoadingState message="Loading notifications…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !items.length ? (
          <EmptyState
            title="No notifications"
            description="New assignments and case updates will appear here."
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
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <em>{formatDateTime(item.createdAt)}</em>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
