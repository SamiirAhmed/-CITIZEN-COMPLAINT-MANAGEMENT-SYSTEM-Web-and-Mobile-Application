import { useEffect } from 'react';

export default function ReportToast({ message, tone = 'info', onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => onClose?.(), 4200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`report-toast report-toast--${tone}`} role="status">
      <span>{message}</span>
      <button type="button" className="report-toast__close" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
