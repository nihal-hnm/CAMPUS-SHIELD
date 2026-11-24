import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useNavigate, useRouteError } from 'react-router-dom';
import { RequireAuth, RequireRole, RoleRedirect } from './Guards';
import { UserLayout, AdminLayout } from '../layouts/Layouts';
import { useAuth } from '../context/AuthContext';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { useReauthRequired } from '../hooks/useSession';
import { SessionExpiryModal } from '../components/security/SessionExpiryModal';
import { getLastActivity } from '../services/apiClient';

// Retry wrapper for lazy-loaded chunks after new Vercel deployments
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((err) => {
      const key = 'cv_chunk_retry';
      const hasRetried = sessionStorage.getItem(key);
      if (!hasRetried) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      sessionStorage.removeItem(key);
      throw err;
    })
  );
}

function RouteErrorBoundary() {
  const err = useRouteError() as any;
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="max-w-md w-full card p-8 text-center space-y-4">
        <h1 className="text-xl font-semibold text-text">Something went wrong</h1>
        <p className="text-sm text-text-muted">
          {err?.message?.includes('dynamically imported module')
            ? 'A new version of CampusShield was deployed. Please reload the page.'
            : (err?.message || 'An unexpected error occurred.')}
        </p>
        <button
          onClick={() => { sessionStorage.removeItem('cv_chunk_retry'); window.location.reload(); }}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import ReauthPage from '../pages/auth/ReauthPage';
import SessionExpiredPage from '../pages/auth/SessionExpiredPage';
import LoggedInElsewherePage from '../pages/auth/LoggedInElsewherePage';

// User pages
const UserDashboardPage     = lazyWithRetry(() => import('../pages/user/DashboardPage'));
const DocumentLibraryPage   = lazyWithRetry(() => import('../pages/user/LibraryPage'));
const DocumentViewerPage    = lazyWithRetry(() => import('../pages/user/ViewerPage'));
const MyPermissionsPage     = lazyWithRetry(() => import('../pages/user/PermissionsPage'));
const AccessRequestsPage    = lazyWithRetry(() => import('../pages/user/RequestsPage'));
const NotificationsPage     = lazyWithRetry(() => import('../pages/user/NotificationsPage'));
const ProfilePage           = lazyWithRetry(() => import('../pages/user/ProfilePage'));
const DeptActivityPage      = lazyWithRetry(() => import('../pages/user/DeptActivityPage'));
const AssignmentsPage       = lazyWithRetry(() => import('../pages/user/AssignmentsPage'));
const FacultyGradingPage    = lazyWithRetry(() => import('../pages/user/FacultyGradingPage'));

// Admin & HOD shared management pages
const AdminDashboardPage      = lazyWithRetry(() => import('../pages/admin/AdminDashboardPage'));
const UserManagementPage      = lazyWithRetry(() => import('../pages/admin/UserManagementPage'));
const DepartmentMgmtPage      = lazyWithRetry(() => import('../pages/admin/DepartmentMgmtPage'));
const RoleManagementPage      = lazyWithRetry(() => import('../pages/admin/RoleManagementPage'));
const TagManagementPage       = lazyWithRetry(() => import('../pages/admin/TagManagementPage'));
const DocumentMgmtPage        = lazyWithRetry(() => import('../pages/admin/DocumentMgmtPage'));
const PermissionMgmtPage      = lazyWithRetry(() => import('../pages/admin/PermissionMgmtPage'));
const AccessRequestsAdminPage = lazyWithRetry(() => import('../pages/admin/AccessRequestsAdminPage'));
const MagicLinksPage          = lazyWithRetry(() => import('../pages/admin/MagicLinksPage'));
const SessionMgmtPage         = lazyWithRetry(() => import('../pages/admin/SessionMgmtPage'));
const EmergencyPage           = lazyWithRetry(() => import('../pages/admin/EmergencyPage'));
const SecurityMonitoringPage  = lazyWithRetry(() => import('../pages/admin/SecurityMonitoringPage'));
const AuditLogsPage           = lazyWithRetry(() => import('../pages/admin/AuditLogsPage'));

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

  useEffect(() => {
    if (loggedInElsewhere) navigate('/logged-in-elsewhere');
  }, [loggedInElsewhere, navigate]);

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
  { path: '/login',               element: <LoginPage />, errorElement: <RouteErrorBoundary /> },
  { path: '/reauth',              element: <ReauthPage />, errorElement: <RouteErrorBoundary /> },
  { path: '/session-expired',     element: <SessionExpiredPage />, errorElement: <RouteErrorBoundary /> },
  { path: '/logged-in-elsewhere', element: <LoggedInElsewherePage />, errorElement: <RouteErrorBoundary /> },
  { path: '/',                    element: <RequireAuth><RoleRedirect /></RequireAuth>, errorElement: <RouteErrorBoundary /> },

  // User & HOD portal
  {
    element: <UserLayoutWrapper />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/dashboard',            element: <Suspense fallback={<Loading />}><UserDashboardPage /></Suspense> },
      { path: '/library',              element: <Suspense fallback={<Loading />}><DocumentLibraryPage /></Suspense> },
      { path: '/documents/:id',        element: <Suspense fallback={<Loading />}><DocumentViewerPage /></Suspense> },
      { path: '/permissions',          element: <Suspense fallback={<Loading />}><MyPermissionsPage /></Suspense> },
      { path: '/requests',             element: <Suspense fallback={<Loading />}><AccessRequestsPage /></Suspense> },
      { path: '/notifications',        element: <Suspense fallback={<Loading />}><NotificationsPage /></Suspense> },
      { path: '/profile',              element: <Suspense fallback={<Loading />}><ProfilePage /></Suspense> },
      { path: '/assignments',          element: <Suspense fallback={<Loading />}><RequireRole roles={['student']}><AssignmentsPage /></RequireRole></Suspense> },
      { path: '/faculty/documents',    element: <Suspense fallback={<Loading />}><RequireRole roles={['faculty']}><DocumentMgmtPage /></RequireRole></Suspense> },
      { path: '/faculty/grades',       element: <Suspense fallback={<Loading />}><RequireRole roles={['faculty', 'dept_admin']}><FacultyGradingPage /></RequireRole></Suspense> },
      { path: '/department/activity',  element: <Suspense fallback={<Loading />}><RequireRole roles={['dept_admin']}><DeptActivityPage /></RequireRole></Suspense> },
      // H.O.D Department-Scoped Management Routes
      { path: '/hod/department',       element: <Suspense fallback={<Loading />}><RequireRole roles={['dept_admin']}><DepartmentMgmtPage /></RequireRole></Suspense> },
      { path: '/hod/documents',        element: <Suspense fallback={<Loading />}><RequireRole roles={['dept_admin']}><DocumentMgmtPage /></RequireRole></Suspense> },
      { path: '/hod/permissions',      element: <Suspense fallback={<Loading />}><RequireRole roles={['dept_admin']}><PermissionMgmtPage /></RequireRole></Suspense> },
      { path: '/hod/magic-links',      element: <Suspense fallback={<Loading />}><RequireRole roles={['dept_admin']}><MagicLinksPage /></RequireRole></Suspense> },
      { path: '/hod/requests',         element: <Suspense fallback={<Loading />}><RequireRole roles={['dept_admin']}><AccessRequestsAdminPage /></RequireRole></Suspense> },
    ],
  },

  // Admin portal
  {
    path: '/admin',
    element: <AdminLayoutWrapper />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true,              element: <Suspense fallback={<Loading />}><AdminDashboardPage /></Suspense> },
      { path: 'users',            element: <Suspense fallback={<Loading />}><UserManagementPage /></Suspense> },
      { path: 'departments',      element: <Suspense fallback={<Loading />}><DepartmentMgmtPage /></Suspense> },
      { path: 'roles',            element: <Suspense fallback={<Loading />}><RoleManagementPage /></Suspense> },
      { path: 'tags',             element: <Suspense fallback={<Loading />}><TagManagementPage /></Suspense> },
      { path: 'documents',        element: <Suspense fallback={<Loading />}><DocumentMgmtPage /></Suspense> },
      { path: 'assignments',      element: <Suspense fallback={<Loading />}><FacultyGradingPage /></Suspense> },
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
