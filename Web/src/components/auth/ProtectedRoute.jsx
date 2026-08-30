import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHomePath } from '../../auth/roles';
import AdminLayout from '../layout/AdminLayout';

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.passwordChangeRequired) {
    return <Navigate to="/change-password-required" replace />;
  }

  return <AdminLayout />;
}

export function RoleProtectedRoute({ roles = [], children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.passwordChangeRequired) {
    return <Navigate to="/change-password-required" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return children || <Outlet />;
}
