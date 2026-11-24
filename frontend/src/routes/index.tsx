import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useNavigate } from 'react-router-dom';
import { RequireAuth, RequireRole, RoleRedirect } from './Guards';
import { UserLayout, AdminLayout } from '../layouts/Layouts';
import { useAuth } from '../context/AuthContext';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { useReauthRequired } from '../hooks/useSession';
import { SessionExpiryModal } from '../components/security/SessionExpiryModal';
import { getLastActivity } from '../services/apiClient';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import ReauthPage from '../pages/auth/ReauthPage';
import SessionExpiredPage from '../pages/auth/SessionExpiredPage';
import LoggedInElsewherePage from '../pages/auth/LoggedInElsewherePage';

// User pages
const UserDashboardPage     = lazy(() => import('../pages/user/DashboardPage'));
const DocumentLibraryPage   = lazy(() => import('../pages/user/LibraryPage'));
const DocumentViewerPage    = lazy(() => import('../pages/user/ViewerPage'));
const MyPermissionsPage     = lazy(() => import('../pages/user/PermissionsPage'));
const AccessRequestsPage    = lazy(() => import('../pages/user/RequestsPage'));
const NotificationsPage     = lazy(() => import('../pages/user/NotificationsPage'));
const ProfilePage           = lazy(() => import('../pages/user/ProfilePage'));
const DeptActivityPage      = lazy(() => import('../pages/user/DeptActivityPage'));

// Admin pages
const AdminDashboardPage      = lazy(() => import('../pages/admin/AdminDashboardPage'));
const UserManagementPage      = lazy(() => import('../pages/admin/UserManagementPage'));
const DepartmentMgmtPage      = lazy(() => import('../pages/admin/DepartmentMgmtPage'));
const RoleManagementPage      = lazy(() => import('../pages/admin/RoleManagementPage'));
const TagManagementPage       = lazy(() => import('../pages/admin/TagManagementPage'));
const DocumentMgmtPage        = lazy(() => import('../pages/admin/DocumentMgmtPage'));
const PermissionMgmtPage      = lazy(() => import('../pages/admin/PermissionMgmtPage'));
const AccessRequestsAdminPage = lazy(() => import('../pages/admin/AccessRequestsAdminPage'));
const MagicLinksPage          = lazy(() => import('../pages/admin/MagicLinksPage'));
const SessionMgmtPage         = lazy(() => import('../pages/admin/SessionMgmtPage'));
const EmergencyPage           = lazy(() => import('../pages/admin/EmergencyPage'));
const SecurityMonitoringPage  = lazy(() => import('../pages/admin/SecurityMonitoringPage'));
const AuditLogsPage           = lazy(() => import('../pages/admin/AuditLogsPage'));

const Loading = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
  </div>
);

// Session-enforcing wrapper
function SessionEnforcer({ children }: { children: React.ReactNode }) {
  const { user, logout, signinTime, loggedInElsewhere } = useAuth();
  const navigate = useNavigate();
  const reauthRequired = useReauthRequired(signinTime);
  const [idleSecs, setIdleSecs] = useState(600);

  // Redirect to "logged in elsewhere" page if session was stolen
  useEffect(() => {
    if (loggedInElsewhere) navigate('/logged-in-elsewhere');
  }, [loggedInElsewhere, navigate]);

  // Countdown ticker — updates every second
  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, 600 - Math.floor((Date.now() - getLastActivity()) / 1000));
      setIdleSecs(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleStaySignedIn = useCallback(() => {
    document.dispatchEvent(new MouseEvent('mousemove'));
    setIdleSecs(600);
  }, []);

  useIdleTimer(() => {
    logout().then(() => navigate('/session-expired?reason=IDLE_TIMEOUT'));
  });

  useEffect(() => {
    if (reauthRequired && user) navigate('/reauth');
  }, [reauthRequired, user, navigate]);

  return (
    <>
      {children}
      <SessionExpiryModal
        idleTimeoutSecs={idleSecs}
        onStaySignedIn={handleStaySignedIn}
        onSignOut={() => logout().then(() => navigate('/session-expired?reason=LOGGED_OUT'))}
      />
    </>
  );
}

function UserLayoutWrapper() {
  return (
    <RequireAuth>
      <SessionEnforcer>
        <UserLayout><Outlet /></UserLayout>
      </SessionEnforcer>
    </RequireAuth>
  );
}

function AdminLayoutWrapper() {
  return (
    <RequireAuth>
      <RequireRole roles={['super_admin', 'ultra_admin'] as any}>
        <SessionEnforcer>
          <AdminLayout><Outlet /></AdminLayout>
        </SessionEnforcer>
      </RequireRole>
    </RequireAuth>
  );
}

const router = createBrowserRouter([
  { path: '/login',               element: <LoginPage /> },
  { path: '/reauth',              element: <ReauthPage /> },
  { path: '/session-expired',     element: <SessionExpiredPage /> },
  { path: '/logged-in-elsewhere', element: <LoggedInElsewherePage /> },
  { path: '/',                    element: <RequireAuth><RoleRedirect /></RequireAuth> },

  // User portal
  {
    element: <UserLayoutWrapper />,
    children: [
      { path: '/dashboard',            element: <Suspense fallback={<Loading />}><UserDashboardPage /></Suspense> },
      { path: '/library',              element: <Suspense fallback={<Loading />}><DocumentLibraryPage /></Suspense> },
      { path: '/documents/:id',        element: <Suspense fallback={<Loading />}><DocumentViewerPage /></Suspense> },
      { path: '/permissions',          element: <Suspense fallback={<Loading />}><MyPermissionsPage /></Suspense> },
      { path: '/requests',             element: <Suspense fallback={<Loading />}><AccessRequestsPage /></Suspense> },
      { path: '/notifications',        element: <Suspense fallback={<Loading />}><NotificationsPage /></Suspense> },
      { path: '/profile',              element: <Suspense fallback={<Loading />}><ProfilePage /></Suspense> },
      { path: '/department/activity',  element: <Suspense fallback={<Loading />}><RequireRole roles={['dept_admin']}><DeptActivityPage /></RequireRole></Suspense> },
    ],
  },

  // Admin portal
  {
    path: '/admin',
    element: <AdminLayoutWrapper />,
    children: [
      { index: true,              element: <Suspense fallback={<Loading />}><AdminDashboardPage /></Suspense> },
      { path: 'users',            element: <Suspense fallback={<Loading />}><UserManagementPage /></Suspense> },
      { path: 'departments',      element: <Suspense fallback={<Loading />}><DepartmentMgmtPage /></Suspense> },
      { path: 'roles',            element: <Suspense fallback={<Loading />}><RoleManagementPage /></Suspense> },
      { path: 'tags',             element: <Suspense fallback={<Loading />}><TagManagementPage /></Suspense> },
      { path: 'documents',        element: <Suspense fallback={<Loading />}><DocumentMgmtPage /></Suspense> },
      { path: 'permissions',      element: <Suspense fallback={<Loading />}><PermissionMgmtPage /></Suspense> },
      { path: 'magic-links',      element: <Suspense fallback={<Loading />}><MagicLinksPage /></Suspense> },
      { path: 'requests',         element: <Suspense fallback={<Loading />}><AccessRequestsAdminPage /></Suspense> },
      { path: 'sessions',         element: <Suspense fallback={<Loading />}><SessionMgmtPage /></Suspense> },
      { path: 'emergency',        element: <Suspense fallback={<Loading />}><EmergencyPage /></Suspense> },
      { path: 'security',         element: <Suspense fallback={<Loading />}><SecurityMonitoringPage /></Suspense> },
      { path: 'audit',            element: <Suspense fallback={<Loading />}><AuditLogsPage /></Suspense> },
    ],
  },

  { path: '*', element: <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-semibold text-text">404 — Page not found</h1><a href="/" className="text-primary text-sm mt-2 inline-block">Go home</a></div></div> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
