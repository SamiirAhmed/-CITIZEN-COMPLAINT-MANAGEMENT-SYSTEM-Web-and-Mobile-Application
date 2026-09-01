import { NavLink } from 'react-router-dom';

/**
 * Premium horizontal tabs — reference: Exam Appeals style.
 * Supports either React Router NavLinks (to) or button tabs (onSelect).
 */
export default function PremiumTabs({
  tabs = [],
  activeId = '',
  onSelect,
  ariaLabel = 'Section tabs',
}) {
  return (
    <nav className="premium-tabs" aria-label={ariaLabel}>
      <div className="premium-tabs__track">
        {tabs.map((tab) => {
          const className = ({ isActive } = {}) => {
            const active = tab.to ? isActive : activeId === tab.id;
            return `premium-tabs__item${active ? ' is-active' : ''}`;
          };

          if (tab.to) {
            return (
              <NavLink
                key={tab.id}
                to={tab.to}
                end={tab.end !== false}
                className={({ isActive }) => className({ isActive })}
              >
                {tab.label}
              </NavLink>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              className={className()}
              onClick={() => onSelect?.(tab.id)}
              aria-current={activeId === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function PageSectionHeader({
  title,
  subtitle,
  tabs = [],
  activeId,
  onSelectTab,
  actions = null,
  ariaLabel,
}) {
  return (
    <header className="page-section-header">
      <div className="page-section-header__top">
        <div>
          <h1 className="page-section-header__title">{title}</h1>
          {subtitle ? (
            <p className="page-section-header__subtitle">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="page-section-header__actions">{actions}</div>
        ) : null}
      </div>
      {tabs.length ? (
        <PremiumTabs
          tabs={tabs}
          activeId={activeId}
          onSelect={onSelectTab}
          ariaLabel={ariaLabel || `${title} tabs`}
        />
      ) : null}
    </header>
  );
}
