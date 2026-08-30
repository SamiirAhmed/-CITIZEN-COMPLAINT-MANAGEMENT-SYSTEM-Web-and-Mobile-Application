<<<<<<< HEAD
﻿import { useAuth } from '../../context/AuthContext';
=======
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminProfileMenu from './AdminProfileMenu';
import NotificationDropdown from './NotificationDropdown';

const SEARCH_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      fill="currentColor"
      d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4z"
    />
  </svg>
);

const FULLSCREEN_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      fill="currentColor"
      d="M7 14H5v5h5v-2H7v-3zm12 0h-2v3h-3v2h5v-5zM7 7h3V5H5v5h2V7zm12-2h-5v2h3v3h2V5z"
    />
  </svg>
);
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706

export default function AdminHeader({ title, onToggleSidebar }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const welcomeName = user?.name || 'System Administrator';

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('admin-header-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (user?.role === 'police') {
      if (!trimmed) {
        navigate('/ob-records');
        return;
      }
      navigate(`/ob-records?search=${encodeURIComponent(trimmed)}`);
      return;
    }
    if (!trimmed) {
      navigate('/citizens');
      return;
    }
    navigate(`/citizens?search=${encodeURIComponent(trimmed)}`);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by the browser.
    }
  };

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <button
          type="button"
          className="icon-btn admin-header__menu"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          â˜°
        </button>
        <div>
          <h1>{title}</h1>
          <p className="admin-header__welcome">Welcome back, {welcomeName}</p>
        </div>
      </div>

      <form className="header-search" onSubmit={handleSearch} role="search">
        <span className="header-search__icon">{SEARCH_ICON}</span>
        <input
          id="admin-header-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={user?.role === 'police' ? 'Search OB records…' : 'Search citizens…'}
          aria-label={user?.role === 'police' ? 'Search OB records' : 'Search citizens'}
        />
        <kbd className="header-search__kbd">Ctrl K</kbd>
      </form>

      <div className="admin-header__right">
        <NotificationDropdown />
        <button
          type="button"
          className="icon-btn"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {FULLSCREEN_ICON}
        </button>
        <AdminProfileMenu showMeta />
      </div>
    </header>
  );
}

