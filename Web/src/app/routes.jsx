import { Navigate, Route, Routes } from 'react-router-dom';
import { getHomePath } from '../auth/roles';
import { ProtectedRoute, RoleProtectedRoute } from '../components/auth/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { getFirstAllowedPath, userHasModule } from '../navigation/adminNavigation';
import LoginPage from '../pages/LoginPage';
import ForceChangePasswordPage from '../pages/ForceChangePasswordPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
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
import ProfilePage from '../pages/ProfilePage';
import ReportsPage from '../pages/ReportsPage';
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

function ModuleRoute({ moduleKey, children }) {
  const { user } = useAuth();

  if (user?.role === 'police') {
    if (ADMIN_ONLY_MODULES.has(moduleKey)) {
      return <Navigate to={getHomePath(user)} replace />;
    }
    return children;
  }

  if (!userHasModule(user, moduleKey)) {
    return <Navigate to={getFirstAllowedPath(user)} replace />;
  }

  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={getHomePath(user)} replace />;
}

function CatchAllRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getHomePath(user)} replace />;
}

function OBRecordsRoute() {
  const { user } = useAuth();
  if (user?.role === 'police') {
    return <PoliceOBRecordsPage />;
  }
  if (!userHasModule(user, 'ob-records')) {
    return <Navigate to={getFirstAllowedPath(user)} replace />;
  }
  return <OBRecordsPage />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/police/login" element={<Navigate to="/login" replace />} />
      <Route path="/change-password-required" element={<ForceChangePasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/dashboard" element={<HomeRedirect />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/admin/dashboard"
          element={
            <RoleProtectedRoute roles={['admin']}>
              <DashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/police/dashboard"
          element={
            <RoleProtectedRoute roles={['police']}>
              <PoliceDashboardPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/citizens"
          element={
            <RoleProtectedRoute roles={['admin']}>
              <ModuleRoute moduleKey="citizens">
                <CitizensPage />
              </ModuleRoute>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/citizens/:id"
          element={
            <RoleProtectedRoute roles={['admin']}>
              <ModuleRoute moduleKey="citizens">
                <CitizenDetailsPage />
              </ModuleRoute>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/complaints"
          element={
            <RoleProtectedRoute roles={['admin']}>
              <ModuleRoute moduleKey="complaints">
                <ComplaintsPage />
              </ModuleRoute>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/ob-records"
          element={
            <RoleProtectedRoute roles={['admin', 'police']}>
              <ModuleRoute moduleKey="ob-records">
                <OBRecordsRoute />
              </ModuleRoute>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/ob-records/:id"
          element={
            <RoleProtectedRoute roles={['police']}>
              <PoliceOBDetailsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/investigation"
          element={
            <RoleProtectedRoute roles={['police']}>
              <PoliceInvestigationPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <RoleProtectedRoute roles={['police']}>
              <PoliceNotificationsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <RoleProtectedRoute roles={['admin']}>
              <ModuleRoute moduleKey="reports">
                <ReportsPage />
              </ModuleRoute>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <RoleProtectedRoute roles={['admin']}>
              <ModuleRoute moduleKey="audit-logs">
                <AuditLogsPage />
              </ModuleRoute>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleProtectedRoute roles={['admin']}>
              <ModuleRoute moduleKey="settings">
                <SettingsPage />
              </ModuleRoute>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/settings/users"
          element={
            <RoleProtectedRoute roles={['admin']}>
              <ModuleRoute moduleKey="settings">
                <UsersPage />
              </ModuleRoute>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/settings/permissions"
          element={
            <RoleProtectedRoute roles={['admin']}>
              <ModuleRoute moduleKey="settings">
                <PermissionsPage />
              </ModuleRoute>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/settings/categories"
          element={
            <RoleProtectedRoute roles={['admin']}>
              <ModuleRoute moduleKey="settings">
                <CategoriesPage />
              </ModuleRoute>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/settings/districts"
          element={
            <RoleProtectedRoute roles={['admin']}>
              <ModuleRoute moduleKey="settings">
                <DistrictsPage />
              </ModuleRoute>
            </RoleProtectedRoute>
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

      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}
