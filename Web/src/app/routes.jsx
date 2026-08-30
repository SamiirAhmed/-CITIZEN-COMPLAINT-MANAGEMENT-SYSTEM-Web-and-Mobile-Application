<<<<<<< HEAD
﻿import { Navigate, Route, Routes } from 'react-router-dom';
=======
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
import AdminLayout from '../components/layout/AdminLayout';
import { useAuth } from '../context/AuthContext';
import {
  getFirstAllowedPath,
  getHomePath,
  userHasModule,
} from '../navigation/adminNavigation';
import LoginPage from '../pages/LoginPage';
<<<<<<< HEAD
import ForceChangePasswordPage from '../pages/ForceChangePasswordPage';
=======
import PoliceLoginPage from '../pages/PoliceLoginPage';
>>>>>>> da921d70880b08e5b0f04686ff0264e78d57ccae
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
<<<<<<< HEAD
import EditProfilePage from '../pages/EditProfilePage';
import OBRecordsPage from '../pages/OBRecordsPage';
import ReportsPage from '../pages/ReportsPage';
=======
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
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706

function ProtectedRoute() {
<<<<<<< HEAD
  const { isAuthenticated, user } = useAuth();
=======
  const { isAuthenticated } = useAuth();
  const location = useLocation();
>>>>>>> da921d70880b08e5b0f04686ff0264e78d57ccae

  if (!isAuthenticated) {
    const loginPath = location.pathname.startsWith('/police') ? '/police/login' : '/login';
    return <Navigate to={loginPath} replace />;
  }

  if (user?.passwordChangeRequired) {
    return <Navigate to="/change-password-required" replace />;
  }

  return <AdminLayout />;
}

function ModuleRoute({ moduleKey, children }) {
  const { user } = useAuth();

  if (user?.role === 'police') {
    if (ADMIN_ONLY_MODULES.has(moduleKey)) {
      return <Navigate to="/police/dashboard" replace />;
    }
    return children;
  }

  if (!userHasModule(user, moduleKey)) {
    return <Navigate to={getFirstAllowedPath(user)} replace />;
  }

  return children;
}

function PoliceRoute({ children }) {
  const { user } = useAuth();

  if (user?.role !== 'police') {
    return <Navigate to={getHomePath(user)} replace />;
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

function AdminDashboardRoute() {
  const { user } = useAuth();
  if (user?.role === 'police') {
    return <Navigate to="/police/dashboard" replace />;
  }
  return <DashboardPage />;
}

function OBRecordsRoute() {
  const { user } = useAuth();
  if (user?.role === 'police') return <PoliceOBRecordsPage />;
  return <OBRecordsPage />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
<<<<<<< HEAD
      <Route path="/change-password-required" element={<ForceChangePasswordPage />} />
=======
      <Route path="/police/login" element={<PoliceLoginPage />} />
>>>>>>> da921d70880b08e5b0f04686ff0264e78d57ccae

      <Route element={<ProtectedRoute />}>
<<<<<<< HEAD
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
=======
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/dashboard"
          element={
            <ModuleRoute moduleKey="dashboard">
              <AdminDashboardRoute />
            </ModuleRoute>
          }
        />
        <Route
          path="/police/dashboard"
          element={
            <PoliceRoute>
              <PoliceDashboardPage />
            </PoliceRoute>
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
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
      </Route>

      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}

