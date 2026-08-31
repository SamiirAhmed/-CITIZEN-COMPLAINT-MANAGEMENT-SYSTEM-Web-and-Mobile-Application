import { useEffect, useState } from 'react';
import {
  listAreas,
  listDistricts,
  listVillages,
} from '../../services/geographyService';

/**
 * Cascading District → Village → Area select backed by GeographicLocation API.
 * Region is resolved from the selected district when known.
 */
export default function GeographicSelect({
  district = '',
  village = '',
  area = '',
  region = '',
  onChange,
  onDistrictChange,
  onRegionChange,
  districtError = '',
  villageError = '',
  areaError = '',
  regionError = '',
  disabled = false,
  districtRequired = true,
  showSummary = true,
}) {
  const [districtOptions, setDistrictOptions] = useState([]);
  const [villages, setVillages] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [villageEmpty, setVillageEmpty] = useState('');
  const [areaEmpty, setAreaEmpty] = useState('');
  const [resolvedRegion, setResolvedRegion] = useState(region || '');

  const emitChange = (next) => {
    onChange?.(next);
    if (typeof onDistrictChange === 'function' && next.district !== undefined) {
      onDistrictChange(next.district, next.region || '');
    }
    if (typeof onRegionChange === 'function' && next.region) {
      onRegionChange(next.region);
    }
  };

  const loadDistricts = () => {
    setLoadingDistricts(true);
    setLoadError('');
    listDistricts()
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

  useEffect(() => {
    if (!district) {
      setVillages([]);
      setAreas([]);
      setVillageEmpty('');
      setAreaEmpty('');
      return undefined;
    }

    let cancelled = false;
    setLoadingVillages(true);
    setVillageEmpty('');
    setAreaEmpty('');

    const selected = districtOptions.find(
      (item) => item.district === district || item.label === district
    );
    const regionName = selected?.region || region || resolvedRegion || '';

    listVillages(regionName, district)
      .then((items) => {
        if (cancelled) return;
        setVillages(items);
        if (regionName && regionName !== resolvedRegion) {
          setResolvedRegion(regionName);
        }
        if (!items.length) {
          setVillageEmpty('No villages available for this district.');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setVillages([]);
        setVillageEmpty('Unable to load villages.');
      })
      .finally(() => {
        if (!cancelled) setLoadingVillages(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reload when district/options change
  }, [district, districtOptions, region]);

  useEffect(() => {
    if (!district || !village) {
      setAreas([]);
      setAreaEmpty('');
      return undefined;
    }

    let cancelled = false;
    setLoadingAreas(true);
    setAreaEmpty('');

    const regionName = resolvedRegion || region || '';

    listAreas(regionName, district, village)
      .then((items) => {
        if (cancelled) return;
        setAreas(items);
        if (!items.length) {
          setAreaEmpty('No areas available for this village.');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAreas([]);
        setAreaEmpty('Unable to load areas.');
      })
      .finally(() => {
        if (!cancelled) setLoadingAreas(false);
      });

    return () => {
      cancelled = true;
    };
  }, [district, village, region, resolvedRegion]);

  const handleDistrictChange = (value) => {
    const selected = districtOptions.find(
      (item) => item.district === value || item.label === value
    );
    const districtName = selected?.district || value;
    const regionName = selected?.region || '';
    setResolvedRegion(regionName);
    setVillages([]);
    setAreas([]);
    emitChange({
      region: regionName,
      district: districtName,
      village: '',
      area: '',
    });
  };

  const handleVillageChange = (value) => {
    setAreas([]);
    emitChange({
      region: resolvedRegion || region,
      district,
      village: value,
      area: '',
    });
  };

  const handleAreaChange = (value) => {
    emitChange({
      region: resolvedRegion || region,
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
            const key = typeof item === 'string' ? item : `${item.region}-${item.district}`;
            return (
              <option key={key} value={value}>
                {label}
              </option>
            );
          })}
        </select>
        {districtError ? <em className="field-error">{districtError}</em> : null}
        {regionError ? <em className="field-error">{regionError}</em> : null}
      </label>

      <label className="field">
        <span>Village</span>
        <select
          name="village"
          value={village}
          onChange={(event) => handleVillageChange(event.target.value)}
          disabled={disabled || !district || loadingVillages}
        >
          <option value="">
            {!district
              ? 'Select a district first'
              : loadingVillages
                ? 'Loading villages…'
                : 'Select Village'}
          </option>
          {villages.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {villageError ? <em className="field-error">{villageError}</em> : null}
        {!villageError && villageEmpty ? (
          <small className="field-hint">{villageEmpty}</small>
        ) : null}
      </label>

      <label className="field">
        <span>Area</span>
        <select
          name="area"
          value={area}
          onChange={(event) => handleAreaChange(event.target.value)}
          disabled={disabled || !village || loadingAreas}
        >
          <option value="">
            {!village
              ? 'Select a village first'
              : loadingAreas
                ? 'Loading areas…'
                : 'Select Area'}
          </option>
          {areas.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {areaError ? <em className="field-error">{areaError}</em> : null}
        {!areaError && areaEmpty ? (
          <small className="field-hint">{areaEmpty}</small>
        ) : null}
      </label>

      {showSummary && summary ? (
        <div className="field field--full">
          <span className="detail-label">Selected location</span>
          <strong>{summary}</strong>
        </div>
      ) : null}
    </>
  );
}
