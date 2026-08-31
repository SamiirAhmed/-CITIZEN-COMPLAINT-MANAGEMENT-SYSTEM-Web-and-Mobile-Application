import { useEffect } from 'react';

/**
 * Centered media preview (image or open PDF in new tab fallback).
 * Matches existing .image-preview-* styles used by ProfileAvatar.
 */
export default function MediaPreviewModal({
  open,
  onClose,
  title = 'Evidence',
  subtitle = '',
  url = '',
  mimeType = '',
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const isPdf =
    /pdf/i.test(mimeType || '') || /\.pdf(\?|$)/i.test(url || '');
  const isImage =
    /image\//i.test(mimeType || '') ||
    /\.(jpe?g|png|gif|webp|jfif|bmp)(\?|$)/i.test(url || '');

  return (
    <div
      className="image-preview-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="image-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="image-preview-modal__header">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="image-preview-modal__body">
          {isImage && url ? (
            <img src={url} alt={title} />
          ) : url ? (
            <div className="image-preview-modal__fallback" style={{ flexDirection: 'column', gap: 12 }}>
              <p className="muted">{isPdf ? 'PDF document' : 'File preview'}</p>
              <a className="btn btn--primary" href={url} target="_blank" rel="noreferrer">
                Open file
              </a>
            </div>
          ) : (
            <div className="image-preview-modal__fallback">No file</div>
          )}
        </div>
      </div>
    </div>
  );
}
