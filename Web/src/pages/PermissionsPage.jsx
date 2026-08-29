import { useEffect, useState } from 'react';
import ComingSoon from '../components/common/ComingSoon';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { getPermissionsAvailability } from '../services/permissionService';

export default function PermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getPermissionsAvailability();
        if (active) setAvailability(result);
      } catch (err) {
        if (active) setError(err.message || 'Unable to check permissions availability.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingState message="Checking permissions module…" />;
  if (error) return <ErrorState message={error} />;

  if (!availability?.supported) {
    return (
      <ComingSoon
        title="Permissions"
        description={
          availability?.message ||
          'Permissions module is not available yet. Role-based access controls will appear here when supported.'
        }
      />
    );
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h2>Permissions</h2>
        <p className="muted">Permission configuration is available.</p>
      </div>
    </div>
  );
}
