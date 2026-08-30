import { Link } from 'react-router-dom';

const SETTINGS_ITEMS = [
  {
    to: '/settings/users',
    title: 'Users',
    description: 'View staff accounts, register admin/police users, and manage profile photos.',
    badge: 'Staff',
    tone: 'users',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.2 0-7.5 2.1-7.5 4.75V21h15v-2.25C19.5 16.1 16.2 14 12 14Z"
        />
      </svg>
    ),
  },
  {
    to: '/settings/permissions',
    title: 'Permissions',
    description: 'Assign sidebar menus and control what each police user can access.',
    badge: 'Access',
    tone: 'permissions',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm0 10.9 4.3-4.3 1.4 1.4L12 16 6.3 10.3l1.4-1.4L12 12.9Z"
        />
      </svg>
    ),
  },
  {
    to: '/settings/categories',
    title: 'Categories',
    description: 'Create and manage complaint categories used by citizens and staff.',
    badge: 'Catalog',
    tone: 'categories',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
        />
      </svg>
    ),
  },
  {
    to: '/settings/districts',
    title: 'Districts',
    description: 'View district, village, and area records from the shared geographic database.',
    badge: 'Geography',
    tone: 'districts',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"
        />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  return (
    <div className="page-stack">
      <section className="panel settings-hub">
        <div className="settings-hub__header">
          <div>
            <p className="settings-hub__eyebrow">System configuration</p>
            <h2>Settings</h2>
            <p className="muted">
              Manage staff accounts, access controls, and complaint categories for the SPO admin
              portal.
            </p>
          </div>
        </div>

        <div className="settings-links">
          {SETTINGS_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`settings-card settings-card--${item.tone}`}
            >
              <div className="settings-card__top">
                <span className="settings-card__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="settings-card__badge">{item.badge}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="settings-card__cta">
                Open
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M9.3 5.3 15 11H4v2h11l-5.7 5.7 1.4 1.4L18.8 12l-8.1-8.1-1.4 1.4Z"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
