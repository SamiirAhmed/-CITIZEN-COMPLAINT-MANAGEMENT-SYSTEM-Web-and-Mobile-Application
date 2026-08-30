import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
}

function isRecordActive(record) {
  return record?.isActive !== false && record?.isActive !== 'false' && record?.isActive !== 0;
}

export default function CategoryTable({
  categories = [],
  onView,
  onEdit,
  onToggleStatus,
  busyId = null,
}) {
  if (!categories.length) {
    return (
      <EmptyState
        title="No categories found"
        description="Add a category or adjust your search and status filters."
      />
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const id = category.id;
            const busy = busyId === id;
            const active = isRecordActive(category);
            const statusActionLabel = active ? 'Deactivate' : 'Activate';
            return (
              <tr key={id}>
                <td className="cell-name">{category.name}</td>
                <td className="cell-muted">{category.description || '—'}</td>
                <td>
                  <StatusBadge status={active ? 'Active' : 'Inactive'} />
                </td>
                <td className="cell-muted">{formatDate(category.updatedAt || category.createdAt)}</td>
                <td>
                  <div className="action-row">
                    <button
                      type="button"
                      className="btn btn--table"
                      onClick={() => onView(category)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn btn--table"
                      onClick={() => onEdit(category)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`btn btn--table ${active ? 'btn--table-danger' : 'btn--table-success'}`}
                      disabled={busy}
                      aria-label={`${statusActionLabel} ${category.name}`}
                      title={
                        active
                          ? 'Status is Active — click to deactivate'
                          : 'Status is Inactive — click to activate'
                      }
                      onClick={() => onToggleStatus(category)}
                    >
                      {busy ? 'Updating…' : statusActionLabel}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
