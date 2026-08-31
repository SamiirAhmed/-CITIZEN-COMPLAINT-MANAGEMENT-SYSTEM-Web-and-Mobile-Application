import { useCallback, useEffect, useState } from 'react';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { SettingsShell } from '../components/layout/SettingsShell';
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
      setLocations(rows.filter((row) => row.village || row.area));
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

  return (
    <SettingsShell>
      <div className="toolbar">
        <input
          className="toolbar__search"
          type="search"
          placeholder="Search district, village, or area"
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
                <th>District</th>
                <th>Village</th>
                <th>Area</th>
              </tr>
            </thead>
            <tbody>
              {locations.length ? (
                locations.map((row) => (
                  <tr key={row.id}>
                    <td>{row.district}</td>
                    <td>{row.village || '—'}</td>
                    <td>{row.area || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="table-empty">
                    No village or area records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </SettingsShell>
  );
}
