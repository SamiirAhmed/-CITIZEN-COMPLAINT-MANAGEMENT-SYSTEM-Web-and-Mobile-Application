import LOGO_SRC, { LOGO_MARK_SRC } from '../../assets/branding';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  filterNavigationForUser,
  isSettingsPath,
} from '../../navigation/adminNavigation';
import { getPortalLabel } from '../../auth/roles';

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h7v7H4V4zm9 0h7v5h-7V4zM4 13h7v7H4v-7zm9 3h7v4h-7v-4zm0-3h7v2h-7v-2z" />
    </svg>
  ),
  citizens: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" />
    </svg>
  ),
  complaints: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h9l5 5v15H6V2zm8 1.5V8h4.5L14 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
    </svg>
  ),
  ob: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19V9h2v10H5zm6 0V5h2v14h-2zm6 0v-6h2v6h-2z" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3zm0 4 5 2v3.5c0 3.4-2.1 6.4-5 7.7-2.9-1.3-5-4.3-5-7.7V8l5-2z" />
    </svg>
  ),
  sms: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12zM7 9h10v2H7V9zm0-3h10v2H7V6zm0 6h7v2H7v-2z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.1 12.9a7.4 7.4 0 0 0 .1-1.8l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.6-.9L14.8 2h-4l-.4 2.6a7.6 7.6 0 0 0-1.6.9l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0-.1 1.8l-2 1.6 2 3.4 2.4-1c.5.4 1 .7 1.6.9L10.8 22h4l.4-2.6c.6-.2 1.1-.5 1.6-.9l2.4 1 2-3.4-2-1.6zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 9 11zm0 2c-3.3 0-6 1.7-6 3.5V19h12v-2.5C15 14.7 12.3 13 9 13zm8.5-1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 17.5 12zm0 2c-.5 0-1 .1-1.5.2 1.4.8 2.5 2 2.5 3.3V19H22v-1.5c0-1.5-2-2.5-4.5-2.5z" />
    </svg>
  ),
  permissions: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1 3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4zm0 6a3 3 0 0 1 3 3v1h1v6H8v-6h1v-1a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v1h2v-1a1 1 0 0 0-1-1z" />
    </svg>
  ),
  categories: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
    </svg>
  ),
  districts: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
    </svg>
  ),
};

function NavItem({ item, collapsed, onNavigate, settingsOpen, onToggleSettings }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (item.expandable) {
    const settingsActive = isSettingsPath(location.pathname);

    return (
      <div className="nav-group">
        <button
          type="button"
          className={[
            'nav-link',
            'nav-link--parent',
            settingsActive ? 'is-active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          title={collapsed ? item.label : undefined}
          onClick={() => {
            if (collapsed) {
              navigate('/settings');
              onNavigate?.();
              return;
            }
            if (!settingsOpen) {
              onToggleSettings(true);
              navigate('/settings');
              onNavigate?.();
            } else if (!settingsActive) {
              navigate('/settings');
              onNavigate?.();
            } else {
              onToggleSettings(false);
            }
          }}
          aria-expanded={settingsOpen}
        >
          <span className="nav-link__icon">{ICONS[item.icon]}</span>
          <span className="nav-link__label">{item.label}</span>
          <span className={`nav-link__chevron ${settingsOpen ? 'is-open' : ''}`}>▾</span>
          {collapsed ? <span className="nav-tooltip">{item.label}</span> : null}
        </button>
        {settingsOpen && !collapsed ? (
          <div className="nav-group__children">
            {item.children.map((child) => (
              <NavLink
                key={child.id}
                to={child.path}
                className={({ isActive }) =>
                  `nav-link nav-link--child ${isActive ? 'is-active' : ''}`
                }
                onClick={onNavigate}
              >
                <span className="nav-link__icon">{ICONS[child.icon]}</span>
                <span className="nav-link__label">{child.label}</span>
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      end={item.path === '/admin/dashboard' || item.path === '/police/dashboard'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
      onClick={onNavigate}
    >
      <span className="nav-link__icon">{ICONS[item.icon]}</span>
      <span className="nav-link__label">{item.label}</span>
      {item.comingSoon ? <span className="nav-link__soon">Soon</span> : null}
      {collapsed ? <span className="nav-tooltip">{item.label}</span> : null}
    </NavLink>
  );
}

export default function AdminSidebar({ collapsed, mobileOpen, onNavigate }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigation = useMemo(() => filterNavigationForUser(user), [user]);
  const [settingsOpen, setSettingsOpen] = useState(() => isSettingsPath(location.pathname));

  useEffect(() => {
    if (isSettingsPath(location.pathname)) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  const mainItems = navigation.filter((item) => item.section === 'main');
  const systemItems = navigation.filter((item) => item.section !== 'main');

  return (
    <aside
      className={[
        'admin-sidebar',
        collapsed ? 'admin-sidebar--collapsed' : '',
        mobileOpen ? 'admin-sidebar--mobile-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__logo-tile">
          <img src={LOGO_MARK_SRC || LOGO_SRC} alt="SPO logo" />
        </div>
        <div className="admin-sidebar__brand-text">
          <strong>SPO</strong>
          <span>Somali Police OBE</span>
          <em className="admin-sidebar__portal">{getPortalLabel(user?.role)}</em>
        </div>
      </div>

      <nav className="admin-sidebar__nav" aria-label={`${getPortalLabel(user?.role)} navigation`}>
        {mainItems.length ? (
          <div className="nav-section">
            {!collapsed ? <p className="nav-section__label">MAIN MENU</p> : null}
            {mainItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                collapsed={collapsed}
                onNavigate={onNavigate}
                settingsOpen={settingsOpen}
                onToggleSettings={setSettingsOpen}
              />
            ))}
          </div>
        ) : null}

        {systemItems.length ? (
          <div className="nav-section">
            {!collapsed ? <p className="nav-section__label">SYSTEM</p> : null}
            {systemItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                collapsed={collapsed}
                onNavigate={onNavigate}
                settingsOpen={settingsOpen}
                onToggleSettings={setSettingsOpen}
              />
            ))}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
