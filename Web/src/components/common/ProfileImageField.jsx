import { useEffect, useRef, useState } from 'react';
import ProfileAvatar from './ProfileAvatar';
import { validateProfileImageFile } from '../../validation/imageValidation';

/**
 * Current image + optional new-file preview for register/edit forms.
 * required=true for new registrations.
 */
export default function ProfileImageField({
  name = '',
  currentSrc = '',
  required = false,
  valueFile = null,
  onChange,
  error = '',
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!valueFile) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(valueFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [valueFile]);

  const handlePick = (event) => {
    const file = event.target.files?.[0] || null;
    setLocalError('');
    if (!file) {
      onChange?.(null);
      return;
    }
    const result = validateProfileImageFile(file);
    if (!result.ok) {
      setLocalError(result.message);
      onChange?.(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    onChange?.(file);
  };

  const handleClear = () => {
    setLocalError('');
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const displayError = error || localError;

  return (
    <div className="profile-image-field">
      <span className="profile-image-field__label">
        Profile Image{required ? ' *' : ''}
      </span>

      <div className="profile-image-field__card">
        <div className="profile-image-field__preview-wrap">
          {previewUrl ? (
            <span
              className="profile-avatar profile-avatar--photo profile-avatar--ring profile-avatar--lg"
              style={{ width: 104, height: 104 }}
            >
              <img src={previewUrl} alt="New profile preview" />
            </span>
          ) : (
            <ProfileAvatar
              name={name}
              src={currentSrc}
              size={104}
              className="profile-avatar--ring profile-avatar--lg"
            />
          )}
          <span className="profile-image-field__status">
            {previewUrl ? 'New preview' : currentSrc ? 'Current photo' : 'No photo yet'}
          </span>
        </div>

        <div className="profile-image-field__controls">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handlePick}
            disabled={disabled}
            className="profile-image-field__input"
          />
          <div className="profile-image-field__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={openPicker}
              disabled={disabled}
            >
              {previewUrl || currentSrc ? 'Change image' : 'Upload image'}
            </button>
            {previewUrl ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleClear}
                disabled={disabled}
              >
                Cancel new image
              </button>
            ) : null}
          </div>
          <p className="muted profile-image-field__hint">
            JPEG, PNG, or WebP · max 2MB
            {required ? ' · required for new registration' : ''}
          </p>
        </div>
      </div>

      {displayError ? <em className="field-error">{displayError}</em> : null}
    </div>
  );
}
