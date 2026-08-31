import { useMemo, useState } from 'react';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { formatDateTime } from '../../constants/domain';
import EvidenceViewerModal, {
  fileLabel,
  isImageEvidence,
  isPdfEvidence,
  truncateName,
  uploaderName,
} from './EvidenceViewerModal';

const PREVIEW_LIMIT = 8;

function EvidenceThumb({ item, index, onView }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const url = item.url ? resolveMediaUrl(item.url) : '';
  const label = fileLabel(item, index);
  const image = isImageEvidence(item) && url && !failed;
  const pdf = isPdfEvidence(item);

  return (
    <article className="evidence-card">
      <button
        type="button"
        className="evidence-card__media"
        onClick={() => onView(index)}
        title={label}
        aria-label={`View ${label}`}
      >
        {image ? (
          <>
            {!loaded ? <span className="evidence-card__loading">Loading…</span> : null}
            <img
              src={url}
              alt=""
              loading="lazy"
              className="evidence-card__image"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
          </>
        ) : (
          <div className={`evidence-card__file ${pdf ? 'evidence-card__file--pdf' : ''}`}>
            <span>{pdf ? 'PDF' : 'FILE'}</span>
            <em>{truncateName(label, 18)}</em>
          </div>
        )}
      </button>
      <div className="evidence-card__body">
        <strong className="evidence-card__name" title={label}>
          {truncateName(label)}
        </strong>
        <p className="evidence-card__note" title={item.note || ''}>
          {item.note || 'No description'}
        </p>
        <em className="evidence-card__date">{formatDateTime(item.createdAt)}</em>
        {uploaderName(item) ? (
          <em className="evidence-card__uploader">{uploaderName(item)}</em>
        ) : null}
        <button type="button" className="btn btn--table" onClick={() => onView(index)}>
          View
        </button>
      </div>
    </article>
  );
}

/**
 * Premium multi-evidence gallery for OBE details (Admin + Police).
 */
export default function EvidenceList({
  items = [],
  emptyMessage = 'No evidence has been uploaded for this case.',
  showHeading = true,
}) {
  const [viewerIndex, setViewerIndex] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const list = useMemo(
    () => (Array.isArray(items) ? items.filter(Boolean) : []),
    [items]
  );
  const count = list.length;
  const visible = expanded || count <= PREVIEW_LIMIT ? list : list.slice(0, PREVIEW_LIMIT);
  const hasMore = count > PREVIEW_LIMIT && !expanded;

  const openViewer = (index) => setViewerIndex(index);

  return (
    <div className="evidence-gallery">
      {showHeading ? (
        <div className="evidence-gallery__heading">
          <h3 className="evidence-gallery__title">Evidence</h3>
          <span className="evidence-gallery__count">
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        </div>
      ) : (
        <div className="evidence-gallery__heading evidence-gallery__heading--compact">
          <span className="evidence-gallery__count">
            Evidence ({count})
          </span>
        </div>
      )}

      {!count ? (
        <div className="evidence-gallery__empty">
          <strong>Evidence (0)</strong>
          <p className="muted">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="evidence-gallery__grid">
            {visible.map((item, index) => (
              <EvidenceThumb
                key={item.id || `${item.url || item.fileName}-${index}`}
                item={item}
                index={index}
                onView={openViewer}
              />
            ))}
          </div>

          {hasMore ? (
            <div className="evidence-gallery__more">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setExpanded(true)}
              >
                View All Evidence ({count})
              </button>
            </div>
          ) : null}

          {expanded && count > PREVIEW_LIMIT ? (
            <div className="evidence-gallery__more">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setExpanded(false)}
              >
                Show fewer
              </button>
            </div>
          ) : null}
        </>
      )}

      <EvidenceViewerModal
        open={viewerIndex != null}
        items={list}
        index={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
        onChangeIndex={setViewerIndex}
      />
    </div>
  );
}
