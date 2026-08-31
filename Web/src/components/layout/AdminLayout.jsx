import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { adminNavigation } from '../../navigation/adminNavigation';
import { policeNavigation } from '../../navigation/policeNavigation';

function resolveTitle(pathname) {
  const flat = [...adminNavigation, ...policeNavigation].flatMap((item) =>
    item.children ? [item, ...item.children] : [item]
  );

  if (pathname.startsWith('/citizens/') && pathname !== '/citizens') {
    return 'Citizen Details';
  }

  if (pathname.startsWith('/ob-records/') && pathname !== '/ob-records') {
    return 'OB Details';
  }

  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return 'Settings';
  }

  const match = flat.find((item) => item.path === pathname);
  if (pathname === '/reports') return 'Reports & Analytics';
  if (pathname === '/sms-portal') return 'SMS Portal';
  if (pathname === '/chatbot') return 'Chatbot';
  if (pathname === '/police/chatbot') return 'Police Chatbot';
  if (pathname === '/unauthorized') return 'Access unavailable';
  if (pathname === '/notifications') return 'Notifications';
  return match?.label || 'SPO';
}

export default function AdminLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 960) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const title = useMemo(() => resolveTitle(location.pathname), [location.pathname]);

  return (
    <div className={`admin-shell ${collapsed ? 'admin-shell--collapsed' : ''}`}>
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      {mobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="admin-main">
        <AdminHeader
          title={title}
          onToggleSidebar={() => {
            if (window.innerWidth <= 960) {
              setMobileOpen((open) => !open);
            } else {
              setCollapsed((value) => !value);
            }
          }}
        />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
