import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

export default function RecentActivityTable({ activities = [] }) {
  if (!activities.length) {
    return (
      <EmptyState
        title="No recent activity"
        description="Dashboard activity will appear here as citizens and complaints are recorded."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Detail</th>
            <th>Status</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((item) => (
            <tr key={item.id}>
              <td>
                <span className="type-chip">{item.type}</span>
              </td>
              <td>{item.title}</td>
              <td>{item.detail}</td>
              <td>
                <StatusBadge status={item.status} />
              </td>
              <td>{formatDate(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
