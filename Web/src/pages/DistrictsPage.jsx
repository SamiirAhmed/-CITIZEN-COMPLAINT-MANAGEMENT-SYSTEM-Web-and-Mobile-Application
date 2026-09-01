import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import DistrictForm from '../components/geography/DistrictForm';
import { SettingsShell } from '../components/layout/SettingsShell';
import { DEFAULT_REGION } from '../constants/domain';
import {
  createGeography,
  deleteGeography,
  listGeographyTable,
  updateGeography,
} from '../services/geographyService';

export default function DistrictsPage() {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await listGeographyTable({ search, region: DEFAULT_REGION });
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
      const key = row.district;
      if (!map.has(key)) {
        map.set(key, {
          id: row.id,
          district: row.district,
          villages: new Set(),
          areas: new Set(),
        });
      }
      const entry = map.get(key);
      if (!entry.id || (!row.village && !row.area)) {
        entry.id = row.id;
      }
      if (row.village) entry.villages.add(row.village);
      if (row.area) entry.areas.add(row.area);
    });
    return Array.from(map.values())
      .map((item) => ({
        ...item,
        villages: Array.from(item.villages).sort((a, b) => a.localeCompare(b)),
        areas: Array.from(item.areas).sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.district.localeCompare(b.district));
  }, [locations]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await createGeography(payload);
      setCreateOpen(false);
      setNotice('District registered successfully.');
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (payload) => {
    if (!editing?.id) return;
    setSubmitting(true);
    try {
      await updateGeography(editing.id, payload);
      setEditing(null);
      setNotice('District updated successfully.');
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (row) => {
    setConfirmTarget(row);
  };

  const runDelete = async () => {
    if (!confirmTarget?.id) return;
    setBusyId(confirmTarget.id);
    setNotice('');
    try {
      await deleteGeography(confirmTarget.id);
      setNotice(`District "${confirmTarget.district}" removed.`);
      setConfirmTarget(null);
      await load();
    } catch (err) {
      setNotice(err.message || 'Unable to delete district.');
      setConfirmTarget(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SettingsShell
      actions={
        <button type="button" className="btn btn--primary" onClick={() => setCreateOpen(true)}>
          Register District
        </button>
      }
    >
      <p className="muted" style={{ marginTop: 0 }}>
        Manage Banaadir districts for the Citizen Police Portal (e.g. Kahda, Garasbaley, Dharkenley).
        {districtRows.length ? ` ${districtRows.length} district(s) registered.` : ''}
      </p>

      <div className="toolbar">
        <input
          className="toolbar__search"
          type="search"
          placeholder="Search district, village, or area"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {notice ? <div className="alert alert--info">{notice}</div> : null}

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {districtRows.length ? (
                districtRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.district}</td>
                    <td>{row.villages.length ? row.villages.join(', ') : '—'}</td>
                    <td>{row.areas.length ? row.areas.join(', ') : '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() => setEditing(row)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--small"
                          disabled={busyId === row.id}
                          onClick={() => handleDelete(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="table-empty">
                    No Banaadir districts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} title="Register District" onClose={() => setCreateOpen(false)}>
        <DistrictForm
          submitting={submitting}
          submitLabel="Register district"
          onCancel={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      </Modal>

      <Modal open={Boolean(editing)} title="Edit District" onClose={() => setEditing(null)}>
        {editing ? (
          <DistrictForm
            initialValues={{
              district: editing.district || '',
              village: editing.villages[0] || '',
              area: editing.areas[0] || '',
            }}
            submitting={submitting}
            submitLabel="Save changes"
            onCancel={() => setEditing(null)}
            onSubmit={handleEditSubmit}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete District"
        message={
          confirmTarget
            ? `Delete district "${confirmTarget.district}" and its linked villages/areas?`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        busy={Boolean(busyId)}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={runDelete}
      />
    </SettingsShell>
  );
}
