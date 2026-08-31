import { Navigate } from 'react-router-dom';

/** Settings hub redirects into the tabbed Users section. */
export default function SettingsPage() {
  return <Navigate to="/settings/users" replace />;
}
