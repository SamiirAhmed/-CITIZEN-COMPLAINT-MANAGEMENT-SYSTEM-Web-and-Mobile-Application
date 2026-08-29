export default function EmptyState({
  title = 'No records found',
  description = 'There is nothing to show here yet.',
  action = null,
}) {
  return (
    <div className="state-panel state-panel--empty">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
