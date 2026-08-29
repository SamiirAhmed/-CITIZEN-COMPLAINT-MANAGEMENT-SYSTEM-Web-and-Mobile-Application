export default function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="state-panel state-panel--loading" role="status">
      <div className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
