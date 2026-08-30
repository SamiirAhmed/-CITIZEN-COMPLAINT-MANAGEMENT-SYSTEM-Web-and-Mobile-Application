import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  size = 'md',
  footer = null,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && onClose) onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose || undefined}
      role="presentation"
    >
      <div
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div className="modal__heading">
            <h2>{title}</h2>
            {description ? <p className="modal__subtitle">{description}</p> : null}
          </div>
          {onClose ? (
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              ×
            </button>
          ) : (
            <span />
          )}
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
