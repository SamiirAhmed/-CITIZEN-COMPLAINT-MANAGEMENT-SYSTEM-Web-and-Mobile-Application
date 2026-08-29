import { Link } from 'react-router-dom';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import RoleBadge from '../common/RoleBadge';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

const EYE_ICON = (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
    />
  </svg>
);

export default function RecentActivityTable({ activities = [] }) {
  if (!activities.length) {
    return (
      <EmptyState
        title="No recent activity"
        description="Activity will appear here as citizens and complaints are recorded."
      />
    );
  }

  return (
    <div className="table-scroll dash-activity">
      <table className="data-table data-table--compact">
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Detail</th>
            <th>Status</th>
            <th>When</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((item) => (
            <tr key={item.id}>
              <td>
                <RoleBadge role={item.type} />
              </td>
              <td className="cell-name">{item.title}</td>
              <td className="cell-muted">{item.detail}</td>
              <td>
                <StatusBadge status={item.status} />
              </td>
              <td className="cell-muted">{formatDate(item.createdAt)}</td>
              <td>
                {item.href ? (
                  <Link to={item.href} className="icon-btn icon-btn--tiny" aria-label="View">
                    {EYE_ICON}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
