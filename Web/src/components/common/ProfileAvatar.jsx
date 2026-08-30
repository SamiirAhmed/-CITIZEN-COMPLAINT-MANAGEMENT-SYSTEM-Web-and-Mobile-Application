import { useEffect, useMemo, useState } from 'react';
import { resolveMediaUrl } from '../../utils/mediaUrl';

function initialsFromName(name = '') {
  return (
    String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?'
  );
}

/**
 * Circular avatar from Backend profileImage, or initials fallback.
 * Click opens a centered image preview modal (unless previewable={false}).
 */
export default function ProfileAvatar({
  name = '',
  src = '',
  size = 44,
  className = '',
  previewable = true,
}) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const url = useMemo(() => resolveMediaUrl(src), [src]);
  const initials = initialsFromName(name);
  const showImage = Boolean(url) && !failed;
  const canPreview = previewable;

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  const openPreview = (event) => {
    if (!canPreview) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };

  const avatarClass = `profile-avatar ${showImage ? 'profile-avatar--photo' : 'profile-avatar--initials'} ${
    canPreview ? 'profile-avatar--clickable' : ''
  } ${className}`.trim();

  const avatarStyle = {
    width: size,
    height: size,
    fontSize: Math.max(11, Math.round(size * 0.34)),
  };

  const content = showImage ? (
    <img src={url} alt="" onError={() => setFailed(true)} />
  ) : (
    <span className="profile-avatar__fallback">{initials}</span>
  );

  return (
    <>
      {canPreview ? (
        <button
          type="button"
          className={avatarClass}
          style={avatarStyle}
          title={name ? `View photo — ${name}` : 'View photo'}
          aria-label={name ? `View photo of ${name}` : 'View profile photo'}
          onClick={openPreview}
        >
          {content}
        </button>
      ) : (
        <span
          className={avatarClass}
          style={avatarStyle}
          title={name || undefined}
          aria-label={name ? `Photo of ${name}` : 'Profile photo'}
        >
          {content}
        </span>
      )}

      {open ? (
        <div
          className="image-preview-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="image-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-label={name ? `Profile photo — ${name}` : 'Profile photo'}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="image-preview-modal__header">
              <div>
                <h3>{name || 'Profile photo'}</h3>
                <p className="muted">
                  {showImage ? 'Registered profile image' : 'No photo on file — initials shown'}
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="image-preview-modal__body">
              {showImage ? (
                <img src={url} alt={name ? `Profile photo of ${name}` : 'Profile photo'} />
              ) : (
                <div className="image-preview-modal__fallback" aria-hidden="true">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
