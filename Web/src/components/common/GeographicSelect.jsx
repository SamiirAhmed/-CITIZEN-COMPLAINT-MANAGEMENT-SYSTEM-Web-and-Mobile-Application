import { useEffect, useState } from 'react';
import { DEFAULT_REGION } from '../../constants/domain';
import { listDistricts } from '../../services/geographyService';

/**
 * Banaadir district picker with optional free-text village and area fields.
 * Region is fixed to Banaadir and not shown in the UI.
 */
export default function GeographicSelect({
  district = '',
  village = '',
  area = '',
  onChange,
  onDistrictChange,
  districtError = '',
  villageError = '',
  areaError = '',
  disabled = false,
  districtRequired = true,
  showVillage = true,
  showArea = true,
  showSummary = true,
}) {
  const [districtOptions, setDistrictOptions] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadError, setLoadError] = useState('');

  const emitChange = (next) => {
    onChange?.({ region: DEFAULT_REGION, ...next });
    if (typeof onDistrictChange === 'function' && next.district !== undefined) {
      onDistrictChange(next.district, DEFAULT_REGION);
    }
  };

  const loadDistricts = () => {
    setLoadingDistricts(true);
    setLoadError('');
    listDistricts(DEFAULT_REGION)
      .then((items) => setDistrictOptions(items))
      .catch((error) => {
        setLoadError(error.message || 'Unable to load districts.');
        setDistrictOptions([]);
      })
      .finally(() => setLoadingDistricts(false));
  };

  useEffect(() => {
    loadDistricts();
  }, []);

  const handleDistrictChange = (value) => {
    const selected = districtOptions.find(
      (item) => item.district === value || item.label === value
    );
    const districtName = selected?.district || value;
    emitChange({
      district: districtName,
      village: '',
      area: '',
    });
  };

  const handleVillageChange = (value) => {
    emitChange({
      district,
      village: value,
      area,
    });
  };

  const handleAreaChange = (value) => {
    emitChange({
      district,
      village,
      area: value,
    });
  };

  const summaryParts = [district, village, area].filter(Boolean);
  const summary = summaryParts.join(' — ');

  return (
    <>
      {loadError ? (
        <div className="alert alert--error field--full">
          Unable to load districts.{' '}
          <button type="button" className="btn btn--ghost btn--small" onClick={loadDistricts}>
            Retry
          </button>
        </div>
      ) : null}

      <p className="field-hint field--full" style={{ marginTop: 0 }}>
        Banaadir districts (e.g. Kahda, Garasbaley, Dharkenley).
      </p>

      <label className="field">
        <span>District{districtRequired ? '' : ' (optional)'}</span>
        <select
          name="district"
          value={district}
          onChange={(event) => handleDistrictChange(event.target.value)}
          disabled={disabled || loadingDistricts}
        >
          <option value="">
            {loadingDistricts ? 'Loading districts…' : 'Select District'}
          </option>
          {districtOptions.map((item) => {
            const value = typeof item === 'string' ? item : item.district;
            const label = typeof item === 'string' ? item : item.label || item.district;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
        {districtError ? <em className="field-error">{districtError}</em> : null}
      </label>

      {showVillage ? (
        <label className="field">
          <span>Village (optional)</span>
          <input
            type="text"
            name="village"
            value={village}
            onChange={(event) => handleVillageChange(event.target.value)}
            placeholder="Type village name manually"
            disabled={disabled || !district}
          />
          {villageError ? <em className="field-error">{villageError}</em> : null}
          {!villageError ? (
            <small className="field-hint">
              {!district
                ? 'Select a district first.'
                : 'Optional — enter the village near the selected district.'}
            </small>
          ) : null}
        </label>
      ) : null}

      {showArea ? (
        <label className="field">
          <span>Area (optional)</span>
          <input
            type="text"
            name="area"
            value={area}
            onChange={(event) => handleAreaChange(event.target.value)}
            placeholder="Type area or neighborhood manually"
            disabled={disabled || !district}
          />
          {areaError ? <em className="field-error">{areaError}</em> : null}
          {!areaError ? (
            <small className="field-hint">
              {!district
                ? 'Select a district first.'
                : 'Optional — enter the area or neighborhood within the village.'}
            </small>
          ) : null}
        </label>
      ) : null}

      {showSummary && summary ? (
        <div className="field field--full">
          <span className="detail-label">Selected location</span>
          <strong>{summary}</strong>
        </div>
      ) : null}
    </>
  );
}
