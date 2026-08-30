import { useEffect, useState } from 'react';
import { listDistricts, listRegions } from '../../services/geographyService';

export default function GeographicSelect({
  region = '',
  district = '',
  onRegionChange,
  onDistrictChange,
  regionError = '',
  districtError = '',
  disabled = false,
  districtRequired = true,
}) {
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    setLoadingRegions(true);
    listRegions()
      .then((items) => {
        if (active) setRegions(items);
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Unable to load regions.');
      })
      .finally(() => {
        if (active) setLoadingRegions(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!region) {
      setDistricts([]);
      return undefined;
    }

    let active = true;
    setLoadingDistricts(true);
    listDistricts(region)
      .then((items) => {
        if (active) setDistricts(items);
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Unable to load districts.');
      })
      .finally(() => {
        if (active) setLoadingDistricts(false);
      });

    return () => {
      active = false;
    };
  }, [region]);

  return (
    <>
      {loadError ? <div className="alert alert--error">{loadError}</div> : null}

      <label className="field">
        <span>Region</span>
        <select
          name="region"
          value={region}
          onChange={(event) => onRegionChange(event.target.value)}
          disabled={disabled || loadingRegions}
        >
          <option value="">Select region</option>
          {regions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <small className="field-hint">Select the Somali administrative region.</small>
        {regionError ? <em className="field-error">{regionError}</em> : null}
      </label>

      <label className="field">
        <span>District{districtRequired ? '' : ' (optional)'}</span>
        <select
          name="district"
          value={district}
          onChange={(event) => onDistrictChange(event.target.value)}
          disabled={disabled || !region || loadingDistricts}
        >
          <option value="">Select district</option>
          {districts.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <small className="field-hint">Select the district within the chosen region.</small>
        {districtError ? <em className="field-error">{districtError}</em> : null}
      </label>
    </>
  );
}
