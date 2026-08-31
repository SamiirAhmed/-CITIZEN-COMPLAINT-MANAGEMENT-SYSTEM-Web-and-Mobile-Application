import { useEffect, useRef, useState } from 'react';
import { validateEvidenceFiles } from '../../validation/complaintValidation';

export default function EvidenceUploadField({
  files = [],
  onChange,
  error = '',
  disabled = false,
  maxFiles = 5,
}) {
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState('');
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const next = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isImage: String(file.type || '').startsWith('image/'),
      isVideo: String(file.type || '').startsWith('video/'),
    }));
    setPreviews(next);
    return () => {
      next.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [files]);

  const handlePick = (event) => {
    const picked = Array.from(event.target.files || []);
    setLocalError('');
    if (!picked.length) return;

    const merged = [...files, ...picked].slice(0, maxFiles);
    const result = validateEvidenceFiles(merged);
    if (!result.ok) {
      setLocalError(result.message);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    onChange?.(result.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAt = (index) => {
    setLocalError('');
    onChange?.(files.filter((_, i) => i !== index));
  };

  const displayError = error || localError;

  return (
    <div className="field field--full">
      <span>Evidence (images / video)</span>
      <div className="evidence-upload">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.pdf"
          multiple
          disabled={disabled || files.length >= maxFiles}
          onChange={handlePick}
        />
        <small className="field-hint">
          Upload images (JPEG, PNG, WebP) or video (MP4, WebM, MOV). Max {maxFiles} files ·
          25MB each.
        </small>

        {previews.length ? (
          <ul className="evidence-upload__list">
            {previews.map((item, index) => (
              <li key={`${item.file.name}-${index}`} className="evidence-upload__item">
                {item.isImage ? (
                  <img src={item.url} alt={item.file.name} />
                ) : item.isVideo ? (
                  <video src={item.url} controls muted playsInline />
                ) : (
                  <div className="evidence-upload__file">
                    <strong>{item.file.name}</strong>
                    <em>PDF</em>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => removeAt(index)}
                  disabled={disabled}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {displayError ? <em className="field-error">{displayError}</em> : null}
    </div>
  );
}
