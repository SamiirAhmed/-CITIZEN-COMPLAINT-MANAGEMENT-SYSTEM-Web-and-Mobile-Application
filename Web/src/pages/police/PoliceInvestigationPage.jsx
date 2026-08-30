import { useCallback, useEffect, useMemo, useState } from 'react';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import { listStaffOBRecords } from '../../services/obService';
import { matchesOBSearch } from './policeFormat';
import PoliceOBTable from './PoliceOBTable';

const ACTIVE_STATUSES = ['Assigned', 'Under Investigation', 'Reopened'];

export default function PoliceInvestigationPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listStaffOBRecords();
      setRecords(result);
    } catch (err) {
      setError(err.message || 'Unable to load investigations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      records.filter((item) => {
        if (!ACTIVE_STATUSES.includes(item.status)) return false;
        return matchesOBSearch(item, search);
      }),
    [records, search]
  );

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>Investigation</h2>
            <p className="muted">Open an assigned record to start, update, or complete the investigation.</p>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search active investigations"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <LoadingState message="Loading investigations…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <PoliceOBTable
            records={filtered}
            actionLabel="Open"
            emptyTitle="No active investigations"
            emptyMessage="Assigned cases that still need investigation will appear here."
          />
        )}
      </section>
    </div>
  );
}
