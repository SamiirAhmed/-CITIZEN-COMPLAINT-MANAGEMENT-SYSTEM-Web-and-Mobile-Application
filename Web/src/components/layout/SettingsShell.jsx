import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageSectionHeader } from '../common/PremiumTabs';

const SETTINGS_TABS = [
  { id: 'users', label: 'Users', to: '/settings/users' },
  { id: 'permissions', label: 'Permissions', to: '/settings/permissions' },
  { id: 'categories', label: 'Categories', to: '/settings/categories' },
  { id: 'districts', label: 'Districts', to: '/settings/districts' },
];

export function SettingsShell({ children, actions = null }) {
  const location = useLocation();

  const activeId =
    SETTINGS_TABS.find((tab) => location.pathname.startsWith(tab.to))?.id ||
    'users';

  return (
    <div className="page-stack">
      <section className="panel premium-section">
        <PageSectionHeader
          title="SETTINGS"
          subtitle="Manage system configuration and administrative data."
          tabs={SETTINGS_TABS}
          activeId={activeId}
          actions={actions}
          ariaLabel="Settings tabs"
        />
        <div className="premium-section__body">{children}</div>
      </section>
    </div>
  );
}

/** Nested route outlet wrapper (optional). */
export function SettingsLayout() {
  const location = useLocation();
  if (location.pathname === '/settings' || location.pathname === '/settings/') {
    return <Navigate to="/settings/users" replace />;
  }
  return (
    <SettingsShell>
      <Outlet />
    </SettingsShell>
  );
}

export { SETTINGS_TABS };
