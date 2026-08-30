import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import { listStaffOBRecords } from '../../services/obService';
import { matchesOBSearch } from './policeFormat';
import PoliceOBTable from './PoliceOBTable';

export default function PoliceOBRecordsPage() {
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listStaffOBRecords();
      setRecords(result);
    } catch (err) {
      setError(err.message || 'Unable to load OB records.');
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
        if (status && item.status !== status) return false;
        return matchesOBSearch(item, search);
      }),
    [records, search, status]
  );

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>My OB Records</h2>
            <p className="muted">OB records assigned to you.</p>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search by OB number, complaint, or citizen"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Investigation Completed">Investigation Completed</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Reopened">Reopened</option>
          </select>
        </div>

        {loading ? (
          <LoadingState message="Loading OB records…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <PoliceOBTable
            records={filtered}
            emptyTitle="No assigned OB records"
            emptyMessage="Try a different search, or wait for a new assignment."
          />
        )}
      </section>
    </div>
  );
}
