import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resolveNotificationPath } from '../../navigation/adminNavigation';
import { getNotifications, markNotificationRead } from '../../services/notificationService';

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
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

const BELL_ICON = (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z"
    />
  </svg>
);

export default function NotificationDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const rootRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications();
      setUnreadCount(data.unreadCount || 0);
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleOpen = () => {
    setOpen((value) => !value);
    if (!open) load();
  };

  const handleItemClick = async (notification) => {
    const path = resolveNotificationPath(notification, user);

    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item
          )
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Navigation still proceeds if mark-read fails.
      }
    }

    setOpen(false);
    navigate(path);
  };

  const preview = notifications.slice(0, 8);

  return (
    <div className="header-menu" ref={rootRef}>
      <button
        type="button"
        className="icon-btn notification-trigger"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleOpen}
      >
        {BELL_ICON}
        {unreadCount > 0 ? (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="header-popover notification-popover" role="menu">
          <div className="notification-popover__header">
            <strong>Notifications</strong>
            {unreadCount > 0 ? (
              <span className="notification-popover__count">{unreadCount} unread</span>
            ) : null}
          </div>

          <div className="notification-popover__body">
            {loading && !preview.length ? (
              <p className="muted notification-empty">Loading…</p>
            ) : error ? (
              <p className="notification-empty notification-empty--error">{error}</p>
            ) : !preview.length ? (
              <p className="muted notification-empty">No new notifications.</p>
            ) : (
              <ul className="notification-list">
                {preview.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`notification-item ${item.isRead ? '' : 'is-unread'}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.message}</span>
                      <em>{formatRelative(item.createdAt)}</em>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {user?.role === 'police' ? (
            <button
              type="button"
              className="notification-popover__footer"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
            >
              View all notifications
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
