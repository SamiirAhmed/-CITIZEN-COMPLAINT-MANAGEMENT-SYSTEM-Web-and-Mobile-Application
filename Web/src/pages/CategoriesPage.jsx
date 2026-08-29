import { useCallback, useEffect, useState } from 'react';
import CategoryForm from '../components/categories/CategoryForm';
import CategoryTable from '../components/categories/CategoryTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import {
  createCategory,
  listCategories,
  setCategoryStatus,
  updateCategory,
} from '../services/categoryService';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listCategories({ search, status });
      setCategories(result);
    } catch (err) {
      setError(err.message || 'Unable to load categories.');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      const created = await createCategory(payload);
      setCategories((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setCreateOpen(false);
      setNotice('Category created successfully.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const updated = await updateCategory(editing.id, payload);
      setCategories((prev) =>
        prev
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditing(null);
      setNotice('Category updated successfully.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = (category) => {
    const active = category.isActive !== false;
    setConfirmTarget({
      category,
      nextActive: !active,
      label: active ? 'deactivate' : 'activate',
      confirmLabel: active ? 'Deactivate' : 'Activate',
      tone: active ? 'danger' : 'success',
    });
  };

  const runStatusChange = async () => {
    if (!confirmTarget) return;
    const { category, nextActive } = confirmTarget;
    setBusyId(category.id);
    setNotice('');
    try {
      const updated = await setCategoryStatus(category.id, nextActive);
      setCategories((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setNotice(updated.isActive ? 'Category activated.' : 'Category deactivated.');
      setConfirmTarget(null);
    } catch (err) {
      setNotice(err.message || 'Unable to update status.');
      setConfirmTarget(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>Categories</h2>
            <p className="muted">
              Manage complaint categories shared with the Citizen App through the same Backend.
            </p>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => setCreateOpen(true)}>
            Add Category
          </button>
        </div>

        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search categories by name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {notice ? <div className="alert alert--info">{notice}</div> : null}

        {loading ? (
          <LoadingState message="Loading categories…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <CategoryTable
            categories={categories}
            busyId={busyId}
            onView={setViewing}
            onEdit={setEditing}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </section>

      <Modal
        open={createOpen}
        title="Add Category"
        onClose={() => setCreateOpen(false)}
      >
        <CategoryForm
          submitting={submitting}
          submitLabel="Create category"
          onCancel={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        title="Edit Category"
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <CategoryForm
            initialValues={{
              name: editing.name || '',
              description: editing.description || '',
            }}
            submitting={submitting}
            submitLabel="Save changes"
            onCancel={() => setEditing(null)}
            onSubmit={handleEditSubmit}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(viewing)}
        title="Category Details"
        onClose={() => setViewing(null)}
      >
        {viewing ? (
          <div className="detail-grid">
            <div>
              <span className="detail-label">Name</span>
              <strong>{viewing.name}</strong>
            </div>
            <div>
              <span className="detail-label">Status</span>
              <StatusBadge status={viewing.isActive ? 'Active' : 'Inactive'} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span className="detail-label">Description</span>
              <strong>{viewing.description || '—'}</strong>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.confirmLabel || 'Confirm'}
        message={
          confirmTarget
            ? `Are you sure you want to ${confirmTarget.label} category "${confirmTarget.category.name}"?`
            : ''
        }
        confirmLabel={confirmTarget?.confirmLabel || 'Confirm'}
        cancelLabel="Cancel"
        tone={confirmTarget?.tone || 'danger'}
        busy={Boolean(busyId)}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={runStatusChange}
      />
    </div>
  );
}
