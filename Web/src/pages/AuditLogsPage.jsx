import { useCallback, useEffect, useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { listAuditLogs } from '../services/auditService';

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [role, setRole] = useState('');
  const [recordType, setRecordType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listAuditLogs({ search, action, role, recordType });
      setLogs(result);
    } catch (err) {
      setError(err.message || 'Unable to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [search, action, role, recordType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>Audit Logs</h2>
            <p className="muted">Real system activity recorded by the Backend after successful actions.</p>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search user, action, record…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="">All actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="ACTIVATE">ACTIVATE</option>
            <option value="DEACTIVATE">DEACTIVATE</option>
          </select>
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="police">Police</option>
          </select>
          <select value={recordType} onChange={(event) => setRecordType(event.target.value)}>
            <option value="">All record types</option>
            <option value="Citizen">Citizen</option>
            <option value="User">User</option>
            <option value="Category">Category</option>
            <option value="Permissions">Permissions</option>
            <option value="Session">Session</option>
          </select>
        </div>

        {loading ? <LoadingState message="Loading audit logs…" /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}

        {!loading && !error && !logs.length ? (
          <EmptyState
            title="No audit logs found"
            description="Successful admin actions will appear here automatically."
          />
        ) : null}

        {!loading && !error && logs.length ? (
          <div className="table-scroll">
            <table className="data-table data-table--compact">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Related Record</th>
                  <th>Previous</th>
                  <th>New</th>
                  <th>Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id}>
                    <td className="cell-name">{item.actorName}</td>
                    <td className="cell-muted">{item.actorRole || '—'}</td>
                    <td>
                      <span className="type-chip">{item.action}</span>
                    </td>
                    <td>
                      <strong>{item.recordType || '—'}</strong>
                      <div className="cell-muted">
                        {item.recordLabel || item.recordId || '—'}
                      </div>
                    </td>
                    <td className="cell-muted">{item.previousValue || '—'}</td>
                    <td className="cell-muted">{item.newValue || '—'}</td>
                    <td className="cell-muted">{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
