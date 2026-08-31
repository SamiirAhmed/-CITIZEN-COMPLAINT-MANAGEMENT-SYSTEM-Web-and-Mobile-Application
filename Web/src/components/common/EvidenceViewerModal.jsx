import { useEffect, useMemo, useState } from 'react';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { formatDateTime } from '../../constants/domain';

function isImageEvidence(item) {
  const mime = String(item?.mimeType || '');
  const name = String(item?.originalName || item?.fileName || item?.url || '');
  return (
    /image\//i.test(mime) ||
    /\.(jpe?g|png|gif|webp|jfif|bmp)(\?|$)/i.test(name)
  );
}

function isPdfEvidence(item) {
  const mime = String(item?.mimeType || '');
  const name = String(item?.originalName || item?.fileName || item?.url || '');
  return /pdf/i.test(mime) || /\.pdf(\?|$)/i.test(name);
}

function fileLabel(item, index) {
  return item?.originalName || item?.fileName || `Evidence ${index + 1}`;
}

function truncateName(name, max = 28) {
  const value = String(name || '');
  if (value.length <= max) return value;
  const extMatch = value.match(/(\.[a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1] : '';
  const base = value.slice(0, Math.max(8, max - ext.length - 3));
  return `${base}…${ext}`;
}

function uploaderName(item) {
  if (item?.createdBy?.name) return item.createdBy.name;
  if (typeof item?.createdBy === 'string' && item.createdBy) return item.createdBy;
  return '';
}

/**
 * Large evidence lightbox with Previous / Next navigation.
 */
export default function EvidenceViewerModal({
  open,
  items = [],
  index = 0,
  onClose,
  onChangeIndex,
}) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);

  const total = items.length;
  const safeIndex = Math.min(Math.max(index, 0), Math.max(total - 1, 0));
  const item = items[safeIndex] || null;
  const url = item?.url ? resolveMediaUrl(item.url) : '';
  const title = item ? fileLabel(item, safeIndex) : 'Evidence';
  const image = item ? isImageEvidence(item) : false;
  const pdf = item ? isPdfEvidence(item) : false;
  const canPrev = safeIndex > 0;
  const canNext = safeIndex < total - 1;

  useEffect(() => {
    if (!open) return undefined;
    setLoading(true);
    setFailed(false);
    setZoom(1);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowLeft' && canPrev) onChangeIndex?.(safeIndex - 1);
      if (event.key === 'ArrowRight' && canNext) onChangeIndex?.(safeIndex + 1);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, safeIndex, canPrev, canNext, onClose, onChangeIndex]);

  if (!open || !item) return null;

  return (
    <div className="evidence-viewer-backdrop" role="presentation" onClick={onClose}>
      <div
        className="evidence-viewer"
        role="dialog"
        aria-modal="true"
        aria-label="Evidence viewer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="evidence-viewer__header">
          <div>
            <h3>Evidence</h3>
            <p className="muted">
              {safeIndex + 1} of {total}
            </p>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="evidence-viewer__stage">
          {image && url && !failed ? (
            <>
              {loading ? (
                <div className="evidence-viewer__state">Loading evidence…</div>
              ) : null}
              <img
                key={url}
                src={url}
                alt={title}
                className="evidence-viewer__image"
                style={{
                  transform: `scale(${zoom})`,
                  display: loading ? 'none' : 'block',
                }}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setFailed(true);
                }}
              />
            </>
          ) : failed ? (
            <div className="evidence-viewer__state">Unable to load this evidence.</div>
          ) : (
            <div className="evidence-viewer__doc">
              <div className="evidence-viewer__doc-badge">{pdf ? 'PDF' : 'FILE'}</div>
              <p>{title}</p>
              {url ? (
                <a className="btn btn--primary" href={url} target="_blank" rel="noreferrer">
                  Open Original
                </a>
              ) : (
                <p className="muted">No file available.</p>
              )}
            </div>
          )}
        </div>

        <div className="evidence-viewer__meta">
          <div>
            <span className="detail-label">File name</span>
            <strong title={title}>{title}</strong>
          </div>
          <div>
            <span className="detail-label">Description</span>
            <strong>{item.note || '—'}</strong>
          </div>
          <div>
            <span className="detail-label">Uploaded</span>
            <strong>{formatDateTime(item.createdAt)}</strong>
          </div>
          {uploaderName(item) ? (
            <div>
              <span className="detail-label">Uploaded by</span>
              <strong>{uploaderName(item)}</strong>
            </div>
          ) : null}
        </div>

        <div className="evidence-viewer__footer">
          <div className="evidence-viewer__nav">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={!canPrev}
              onClick={() => onChangeIndex?.(safeIndex - 1)}
            >
              ← Previous
            </button>
            <span className="evidence-viewer__counter">
              {safeIndex + 1} of {total}
            </span>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={!canNext}
              onClick={() => onChangeIndex?.(safeIndex + 1)}
            >
              Next →
            </button>
          </div>
          <div className="evidence-viewer__tools">
            {image && url && !failed ? (
              <>
                <button
                  type="button"
                  className="btn btn--table"
                  onClick={() => setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))}
                >
                  Zoom In
                </button>
                <button
                  type="button"
                  className="btn btn--table"
                  onClick={() => setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))}
                >
                  Zoom Out
                </button>
                <button type="button" className="btn btn--table" onClick={() => setZoom(1)}>
                  Reset
                </button>
              </>
            ) : null}
            {url ? (
              <a className="btn btn--table" href={url} target="_blank" rel="noreferrer">
                Open Original
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export {
  isImageEvidence,
  isPdfEvidence,
  fileLabel,
  truncateName,
  uploaderName,
};
