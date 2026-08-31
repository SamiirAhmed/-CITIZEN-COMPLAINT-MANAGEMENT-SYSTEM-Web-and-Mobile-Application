import { useCallback, useEffect, useMemo, useState } from 'react';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { listGeographyTable } from '../services/geographyService';

export default function DistrictsPage() {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await listGeographyTable({ search });
      setLocations(rows);
    } catch (err) {
      setError(err.message || 'Unable to load district data.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const districtRows = useMemo(() => {
    const map = new Map();
    locations.forEach((row) => {
      const key = `${row.region}::${row.district}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          region: row.region,
          district: row.district,
          villages: new Set(),
          areas: new Set(),
        });
      }
      const entry = map.get(key);
      if (row.village) entry.villages.add(row.village);
      if (row.area) entry.areas.add(row.area);
    });
    return Array.from(map.values())
      .map((item) => ({
        ...item,
        villages: Array.from(item.villages).sort((a, b) => a.localeCompare(b)),
        areas: Array.from(item.areas).sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => {
        const regionCmp = a.region.localeCompare(b.region);
        return regionCmp !== 0 ? regionCmp : a.district.localeCompare(b.district);
      });
  }, [locations]);

  const banaadirCount = districtRows.filter((row) => row.region === 'Banaadir').length;

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>Districts</h2>
            <p className="muted">
              Registered geographic districts from the Citizen Police Portal database.
              {banaadirCount ? ` Banaadir currently has ${banaadirCount} districts.` : ''}
            </p>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search region, district, village, or area"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <LoadingState message="Loading districts…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>District</th>
                  <th>Village</th>
                  <th>Area</th>
                </tr>
              </thead>
              <tbody>
                {districtRows.length ? (
                  districtRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.region}</td>
                      <td>{row.district}</td>
                      <td>{row.villages.length ? row.villages.join(', ') : '—'}</td>
                      <td>{row.areas.length ? row.areas.join(', ') : '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="table-empty">
                      No district records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
