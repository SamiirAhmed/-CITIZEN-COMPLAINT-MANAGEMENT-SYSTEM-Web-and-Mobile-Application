import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import CitizensPage from '../pages/CitizensPage';
import CitizenDetailsPage from '../pages/CitizenDetailsPage';
import SettingsPage from '../pages/SettingsPage';
import UsersPage from '../pages/UsersPage';
import PermissionsPage from '../pages/PermissionsPage';
import ComingSoonPage from '../pages/ComingSoonPage';
import EditProfilePage from '../pages/EditProfilePage';
import OBRecordsPage from '../pages/OBRecordsPage';
import ReportsPage from '../pages/ReportsPage';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/citizens" element={<CitizensPage />} />
        <Route path="/citizens/:id" element={<CitizenDetailsPage />} />
        <Route path="/complaints" element={<ComingSoonPage moduleKey="complaints" />} />
        <Route path="/ob-records" element={<OBRecordsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<ComingSoonPage moduleKey="notifications" />} />
        <Route path="/audit-logs" element={<ComingSoonPage moduleKey="audit-logs" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/users" element={<UsersPage />} />
        <Route path="/settings/permissions" element={<PermissionsPage />} />
        <Route path="/profile" element={<EditProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

