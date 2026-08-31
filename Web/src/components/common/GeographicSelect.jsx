import { useEffect, useState } from 'react';
import {
  listAreas,
  listDistricts,
  listRegions,
  listVillages,
} from '../../services/geographyService';

/**
 * Cascading Region → District → Village → Area dropdowns
 * loaded from the Citizen Police Portal geography database.
 */
export default function GeographicSelect({
  region = '',
  district = '',
  village = '',
  area = '',
  onRegionChange,
  onDistrictChange,
  onVillageChange,
  onAreaChange,
  regionError = '',
  districtError = '',
  villageError = '',
  areaError = '',
  disabled = false,
  districtRequired = true,
  villageRequired = false,
  areaRequired = false,
  showVillage = false,
  showArea = false,
}) {
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
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

  useEffect(() => {
    if (!showVillage || !region || !district) {
      setVillages([]);
      return undefined;
    }

    let active = true;
    setLoadingVillages(true);
    listVillages(region, district)
      .then((items) => {
        if (active) setVillages(items);
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Unable to load villages.');
      })
      .finally(() => {
        if (active) setLoadingVillages(false);
      });

    return () => {
      active = false;
    };
  }, [showVillage, region, district]);

  useEffect(() => {
    if (!showArea || !region || !district || !village) {
      setAreas([]);
      return undefined;
    }

    let active = true;
    setLoadingAreas(true);
    listAreas(region, district, village)
      .then((items) => {
        if (active) setAreas(items);
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Unable to load areas.');
      })
      .finally(() => {
        if (active) setLoadingAreas(false);
      });

    return () => {
      active = false;
    };
  }, [showArea, region, district, village]);

  return (
    <>
      {loadError ? <div className="alert alert--error">{loadError}</div> : null}

      <label className="field">
        <span>Region</span>
        <select
          name="region"
          value={region}
          onChange={(event) => onRegionChange?.(event.target.value)}
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
          onChange={(event) => onDistrictChange?.(event.target.value)}
          disabled={disabled || !region || loadingDistricts}
        >
          <option value="">Select district</option>
          {districts.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <small className="field-hint">
          Select a registered district (e.g. the 18 Banaadir districts).
        </small>
        {districtError ? <em className="field-error">{districtError}</em> : null}
      </label>

      {showVillage ? (
        <label className="field">
          <span>Village{villageRequired ? '' : ' (optional)'}</span>
          <select
            name="village"
            value={village}
            onChange={(event) => onVillageChange?.(event.target.value)}
            disabled={disabled || !district || loadingVillages || villages.length === 0}
          >
            <option value="">
              {loadingVillages
                ? 'Loading villages…'
                : villages.length
                  ? 'Select village'
                  : 'No villages registered'}
            </option>
            {villages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <small className="field-hint">Village near the selected district.</small>
          {villageError ? <em className="field-error">{villageError}</em> : null}
        </label>
      ) : null}

      {showArea ? (
        <label className="field">
          <span>Area{areaRequired ? '' : ' (optional)'}</span>
          <select
            name="area"
            value={area}
            onChange={(event) => onAreaChange?.(event.target.value)}
            disabled={disabled || !village || loadingAreas || areas.length === 0}
          >
            <option value="">
              {loadingAreas
                ? 'Loading areas…'
                : areas.length
                  ? 'Select area'
                  : 'No areas registered'}
            </option>
            {areas.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <small className="field-hint">Area / neighborhood within the village.</small>
          {areaError ? <em className="field-error">{areaError}</em> : null}
        </label>
      ) : null}
    </>
  );
}
