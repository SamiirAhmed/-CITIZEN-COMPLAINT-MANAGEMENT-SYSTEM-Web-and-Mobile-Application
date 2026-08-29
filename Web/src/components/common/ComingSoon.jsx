export default function ComingSoon({
  title = 'Coming Soon',
  description = 'This module is under development and will be available in a future release.',
}) {
  return (
    <div className="coming-soon">
      <div className="coming-soon__badge">In progress</div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
