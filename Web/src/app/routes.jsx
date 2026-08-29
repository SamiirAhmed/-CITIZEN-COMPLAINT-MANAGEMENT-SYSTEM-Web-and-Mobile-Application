import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { useAuth } from '../context/AuthContext';
import {
  getFirstAllowedPath,
  userHasModule,
} from '../navigation/adminNavigation';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import CitizensPage from '../pages/CitizensPage';
import CitizenDetailsPage from '../pages/CitizenDetailsPage';
import SettingsPage from '../pages/SettingsPage';
import UsersPage from '../pages/UsersPage';
import PermissionsPage from '../pages/PermissionsPage';
import CategoriesPage from '../pages/CategoriesPage';
import AuditLogsPage from '../pages/AuditLogsPage';
import ComingSoonPage from '../pages/ComingSoonPage';
import ProfilePage from '../pages/ProfilePage';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
              <ComingSoonPage moduleKey="complaints" />
            </ModuleRoute>
          }
        />
        <Route
          path="/ob-records"
          element={
            <ModuleRoute moduleKey="ob-records">
              <ComingSoonPage moduleKey="ob-records" />
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
