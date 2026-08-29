import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { useAuth } from '../context/AuthContext';
import {
  getFirstAllowedPath,
  userHasModule,
} from '../navigation/adminNavigation';
import LoginPage from '../pages/LoginPage';
import PoliceLoginPage from '../pages/PoliceLoginPage';
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
import PoliceDashboardPage from '../pages/police/PoliceDashboardPage';
import PoliceOBRecordsPage from '../pages/police/PoliceOBRecordsPage';
import PoliceOBDetailsPage from '../pages/police/PoliceOBDetailsPage';
import PoliceInvestigationPage from '../pages/police/PoliceInvestigationPage';
import PoliceNotificationsPage from '../pages/police/PoliceNotificationsPage';

const ADMIN_ONLY_MODULES = new Set([
  'citizens',
  'complaints',
  'reports',
  'audit-logs',
  'settings',
]);

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout />;
}

function ModuleRoute({ moduleKey, children }) {
  const { user } = useAuth();

  if (user?.role === 'police' && ADMIN_ONLY_MODULES.has(moduleKey)) {
    return <Navigate to={getFirstAllowedPath(user)} replace />;
  }

  if (!userHasModule(user, moduleKey)) {
    return <Navigate to={getFirstAllowedPath(user)} replace />;
  }

  return children;
}

function PoliceRoute({ children }) {
  const { user } = useAuth();

  if (user?.role !== 'police') {
    return <Navigate to={getFirstAllowedPath(user)} replace />;
  }

  return children;
}

function DashboardRoute() {
  const { user } = useAuth();
  if (user?.role === 'police') return <PoliceDashboardPage />;
  return <DashboardPage />;
}

function OBRecordsRoute() {
  const { user } = useAuth();
  if (user?.role === 'police') return <PoliceOBRecordsPage />;
  return <ComingSoonPage moduleKey="ob-records" />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/police/login" element={<PoliceLoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ModuleRoute moduleKey="dashboard">
              <DashboardRoute />
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
              <OBRecordsRoute />
            </ModuleRoute>
          }
        />
        <Route
          path="/ob-records/:id"
          element={
            <PoliceRoute>
              <PoliceOBDetailsPage />
            </PoliceRoute>
          }
        />
        <Route
          path="/investigation"
          element={
            <PoliceRoute>
              <PoliceInvestigationPage />
            </PoliceRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PoliceRoute>
              <PoliceNotificationsPage />
            </PoliceRoute>
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
