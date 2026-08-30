import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { useAuth } from '../context/AuthContext';
import {
  getFirstAllowedPath,
  userHasModule,
} from '../navigation/adminNavigation';
import LoginPage from '../pages/LoginPage';
import ForceChangePasswordPage from '../pages/ForceChangePasswordPage';
import DashboardPage from '../pages/DashboardPage';
import CitizensPage from '../pages/CitizensPage';
import CitizenDetailsPage from '../pages/CitizenDetailsPage';
import ComplaintsPage from '../pages/ComplaintsPage';
import OBRecordsPage from '../pages/OBRecordsPage';
import SettingsPage from '../pages/SettingsPage';
import UsersPage from '../pages/UsersPage';
import PermissionsPage from '../pages/PermissionsPage';
import CategoriesPage from '../pages/CategoriesPage';
import DistrictsPage from '../pages/DistrictsPage';
import AuditLogsPage from '../pages/AuditLogsPage';
import ComingSoonPage from '../pages/ComingSoonPage';
import ProfilePage from '../pages/ProfilePage';

function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.passwordChangeRequired) {
    return <Navigate to="/change-password-required" replace />;
  }

  return <AdminLayout />;
}

function ModuleRoute({ moduleKey, children }) {
  const { user } = useAuth();

  if (!userHasModule(user, moduleKey)) {
    return <Navigate to={getFirstAllowedPath(user)} replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password-required" element={<ForceChangePasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ModuleRoute moduleKey="dashboard">
              <DashboardPage />
            </ModuleRoute>
          }
        />
        <Route
          path="/citizens"
          element={
            <ModuleRoute moduleKey="citizens">
              <CitizensPage />
            </ModuleRoute>
          }
        />
        <Route
          path="/citizens/:id"
          element={
            <ModuleRoute moduleKey="citizens">
              <CitizenDetailsPage />
            </ModuleRoute>
          }
        />
        <Route
          path="/complaints"
          element={
            <ModuleRoute moduleKey="complaints">
              <ComplaintsPage />
            </ModuleRoute>
          }
        />
        <Route
          path="/ob-records"
          element={
            <ModuleRoute moduleKey="ob-records">
              <OBRecordsPage />
            </ModuleRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ModuleRoute moduleKey="reports">
              <ComingSoonPage moduleKey="reports" />
            </ModuleRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ModuleRoute moduleKey="audit-logs">
              <AuditLogsPage />
            </ModuleRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ModuleRoute moduleKey="settings">
              <SettingsPage />
            </ModuleRoute>
          }
        />
        <Route
          path="/settings/users"
          element={
            <ModuleRoute moduleKey="settings">
              <UsersPage />
            </ModuleRoute>
          }
        />
        <Route
          path="/settings/permissions"
          element={
            <ModuleRoute moduleKey="settings">
              <PermissionsPage />
            </ModuleRoute>
          }
        />
        <Route
          path="/settings/categories"
          element={
            <ModuleRoute moduleKey="settings">
              <CategoriesPage />
            </ModuleRoute>
          }
        />
        <Route
          path="/settings/districts"
          element={
            <ModuleRoute moduleKey="settings">
              <DistrictsPage />
            </ModuleRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ModuleRoute moduleKey="profile">
              <ProfilePage />
            </ModuleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
