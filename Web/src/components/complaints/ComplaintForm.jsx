import { useEffect, useState } from 'react';
import { COMPLAINT_STATUSES, toDateInputValue } from '../../constants/domain';
import { validateComplaintForm } from '../../validation/complaintValidation';
import GeographicSelect from '../common/GeographicSelect';
import EvidenceUploadField from './EvidenceUploadField';

const INITIAL = {
  citizenId: '',
  category: '',
  description: '',
  incidentDate: '',
  location: '',
  region: '',
  district: '',
  village: '',
  area: '',
  relatedInformation: '',
  evidenceNotes: '',
  status: 'Submitted',
  note: '',
};

function buildLocation(district, village, area) {
  return [district, village, area].filter(Boolean).join(', ');
}

export default function ComplaintForm({
  mode = 'create',
  initialValues,
  citizens = [],
  categories = [],
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState({ ...INITIAL, ...initialValues });
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setValues({
      ...INITIAL,
      ...initialValues,
      incidentDate: toDateInputValue(initialValues?.incidentDate) || initialValues?.incidentDate || '',
      region: initialValues?.region || '',
      district: initialValues?.district || '',
      village: initialValues?.village || '',
      area: initialValues?.area || '',
    });
    setEvidenceFiles([]);
    setErrors({});
    setFormError('');
  }, [initialValues, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'village' || name === 'area') {
        next.location = buildLocation(
          prev.district,
          name === 'village' ? value : prev.village,
          name === 'area' ? value : prev.area
        );
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validation = validateComplaintForm(values, { evidenceFiles });
    setErrors(validation.errors);
    if (!validation.ok) return;

    try {
      await onSubmit(validation.data);
    } catch (error) {
      setFormError(error.message || 'Unable to save complaint.');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--error">{formError}</div> : null}

      <label className="field">
        <span>Citizen</span>
        <select name="citizenId" value={values.citizenId} onChange={handleChange}>
          <option value="">Select citizen</option>
          {citizens.map((citizen) => (
            <option key={citizen.id} value={citizen.id}>
              {citizen.name} {citizen.niraId ? `(${citizen.niraId})` : ''}
            </option>
          ))}
        </select>
        {errors.citizenId ? <em className="field-error">{errors.citizenId}</em> : null}
      </label>

      <label className="field">
        <span>Category</span>
        <select name="category" value={values.category} onChange={handleChange}>
          <option value="">Select category</option>
          {categories.map((category) => {
            const name = typeof category === 'string' ? category : category.name;
            const key = typeof category === 'string' ? category : category.id || category.name;
            return (
              <option key={key} value={name}>
                {name}
              </option>
            );
          })}
        </select>
        {errors.category ? <em className="field-error">{errors.category}</em> : null}
      </label>

      <label className="field field--full">
        <span>Description</span>
        <textarea
          name="description"
          rows={4}
          value={values.description}
          onChange={handleChange}
        />
        {errors.description ? <em className="field-error">{errors.description}</em> : null}
      </label>

      <label className="field">
        <span>Incident Date</span>
        <input
          type="date"
          name="incidentDate"
          value={values.incidentDate}
          onChange={handleChange}
        />
        {errors.incidentDate ? <em className="field-error">{errors.incidentDate}</em> : null}
      </label>

      <GeographicSelect
        region={values.region}
        district={values.district}
        onRegionChange={(nextRegion) =>
          setValues((prev) => ({
            ...prev,
            region: nextRegion,
            district: '',
            village: '',
            area: '',
            location: '',
          }))
        }
        onDistrictChange={(nextDistrict) =>
          setValues((prev) => ({
            ...prev,
            district: nextDistrict,
            location: buildLocation(nextDistrict, prev.village, prev.area),
          }))
        }
        regionError={errors.region}
        districtError={errors.district}
        disabled={submitting}
      />

      <label className="field">
        <span>Village (optional)</span>
        <input
          type="text"
          name="village"
          value={values.village}
          onChange={handleChange}
          placeholder="Type village name manually"
          disabled={submitting}
        />
        <small className="field-hint">Optional — enter the village near the selected district.</small>
        {errors.village ? <em className="field-error">{errors.village}</em> : null}
      </label>

      <label className="field">
        <span>Area (optional)</span>
        <input
          type="text"
          name="area"
          value={values.area}
          onChange={handleChange}
          placeholder="Type area or neighborhood manually"
          disabled={submitting}
        />
        <small className="field-hint">Optional — enter the area or neighborhood within the village.</small>
        {errors.area ? <em className="field-error">{errors.area}</em> : null}
      </label>

      <label className="field field--full">
        <span>Related Information</span>
        <textarea
          name="relatedInformation"
          rows={2}
          value={values.relatedInformation}
          onChange={handleChange}
        />
      </label>

      <label className="field field--full">
        <span>Evidence Notes</span>
        <textarea
          name="evidenceNotes"
          rows={2}
          value={values.evidenceNotes}
          onChange={handleChange}
          placeholder="Optional notes about the attached evidence"
        />
      </label>

      <EvidenceUploadField
        files={evidenceFiles}
        onChange={setEvidenceFiles}
        error={errors.evidence}
        disabled={submitting}
      />

      <label className="field">
        <span>Status</span>
        <select name="status" value={values.status} onChange={handleChange}>
          {COMPLAINT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {errors.status ? <em className="field-error">{errors.status}</em> : null}
      </label>

      {isEdit ? (
        <label className="field">
          <span>Status Note</span>
          <input
            name="note"
            value={values.note}
            onChange={handleChange}
            placeholder="Optional note for status change"
          />
        </label>
      ) : null}

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create complaint'}
        </button>
      </div>
    </form>
  );
}
