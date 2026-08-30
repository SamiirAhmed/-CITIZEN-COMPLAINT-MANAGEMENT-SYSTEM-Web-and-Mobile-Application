export default function TablePager({
  page = 1,
  pageCount = 1,
  total = 0,
  pageSize = 10,
  onPageChange,
}) {
  if (!total) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="table-pager">
      <p className="muted">
        Showing {start}–{end} of {total}
      </p>
      <div className="action-row">
        <button
          type="button"
          className="btn btn--ghost btn--small"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
        >
          Previous
        </button>
        <span className="table-pager__page">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          disabled={page >= pageCount}
          onClick={() => onPageChange?.(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
