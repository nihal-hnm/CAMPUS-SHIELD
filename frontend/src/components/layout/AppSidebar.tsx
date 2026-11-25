import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Files, Users, Building2, Shield, Tag, KeyRound,
  Inbox, MonitorSmartphone, OctagonAlert, Activity, History,
  Link2, ChevronLeft, ChevronRight, LogOut, User, X, Upload, Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { cn } from '../../utils/format';
import { formatRole } from '../../constants/roles';
import type { Role } from '../../types/user';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}
interface NavGroup { group: string; items: NavItem[]; }

function adminNav(): NavGroup[] {
  return [
    { group: 'Overview', items: [{ label: 'Dashboard', to: '/admin', icon: LayoutDashboard }] },
    { group: 'Identity', items: [
        { label: 'Users',         to: '/admin/users',       icon: Users },
        { label: 'Departments',   to: '/admin/departments', icon: Building2 },
    ]},
    { group: 'Content', items: [
        { label: 'Documents',     to: '/admin/documents',   icon: Files },
    ]},
    { group: 'Access Control', items: [
        { label: 'Permissions',   to: '/admin/permissions', icon: KeyRound },
        { label: 'Magic Links',   to: '/admin/magic-links', icon: Link2 },
        { label: 'Requests',      to: '/admin/requests',    icon: Inbox },
    ]},
    { group: 'Security', items: [
        { label: 'Sessions',      to: '/admin/sessions',    icon: MonitorSmartphone },
        { label: 'Emergency',     to: '/admin/emergency',   icon: OctagonAlert },
        { label: 'Audit Logs',    to: '/admin/audit',       icon: History },
    ]},
  ];
}

function userNav(role: Role): NavGroup[] {
  const items: NavItem[] = [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }];
  items.push({ label: 'Document Library', to: '/library', icon: Files });
  if (role === 'student') {
    items.push({ label: 'My Assignments', to: '/assignments', icon: Upload });
  }
  if (role !== 'student') {
    items.push({ label: 'My Permissions', to: '/permissions', icon: KeyRound });
  }
  items.push({ label: 'Access Requests', to: '/requests', icon: Inbox });
  items.push({ label: 'Profile', to: '/profile', icon: User });

  const groups: NavGroup[] = [{ group: 'Navigation', items }];
  if (role === 'faculty') {
    groups.push({
      group: 'Faculty Controls',
      items: [
        { label: 'Upload & Docs',         to: '/faculty/documents', icon: Files },
        { label: 'Assignments & Grading', to: '/faculty/grades',    icon: Award },
      ],
    });
  }
  if (role === 'dept_admin') {
    groups.push({
      group: 'H.O.D Controls',
      items: [
        { label: 'Dept Users',            to: '/hod/users',        icon: Users },
        { label: 'Dept & Students',       to: '/hod/department',   icon: Building2 },
        { label: 'Upload & Docs',         to: '/hod/documents',    icon: Files },
        { label: 'Grant Permissions',     to: '/hod/permissions',  icon: KeyRound },
        { label: 'Magic Links',           to: '/hod/magic-links',  icon: Link2 },
        { label: 'Approve Requests',      to: '/hod/requests',     icon: Inbox },
        { label: 'Assignments & Grading', to: '/faculty/grades',   icon: Award },
      ],
    });
  }
  return groups;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { collapsed, toggleCollapsed } = useSidebar();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user.role === 'super_admin' || (user.role as string) === 'ultra_admin';
  const groups = isAdmin ? adminNav() : userNav(user.role);

  return (
    <div className="flex flex-col h-full bg-navy text-text-on-navy">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-navy-hover">
        <Shield className="w-6 h-6 text-primary flex-shrink-0" strokeWidth={2} />
        {(!collapsed || onClose) && (
          <div className="flex-1">
            <span className="text-sm font-semibold text-white">CampusShield</span>
            <p className="text-[10px] text-text-on-navy-muted leading-none mt-0.5">Zero-Trust Platform</p>
          </div>
        )}
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-text-on-navy-muted hover:text-white ml-auto"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {groups.map(({ group, items }) => (
          <div key={group}>
            {!collapsed && (
              <p className="text-xs font-medium text-text-on-navy-muted px-2 mb-1">{group}</p>
            )}
            {items.map(({ label, to, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn('sidebar-item', isActive && 'sidebar-item-active', collapsed && !onClose && 'justify-center px-2')
                }
                title={collapsed && !onClose ? label : undefined}
              >
                <Icon className={cn('flex-shrink-0', collapsed && !onClose ? 'w-5 h-5' : 'w-4 h-4')} />
                {(!collapsed || onClose) && <span className="flex-1">{label}</span>}
                {(!collapsed || onClose) && badge !== undefined && badge > 0 && (
                  <span className="ml-auto text-[10px] font-semibold bg-primary text-white rounded-full px-1.5 py-0.5">{badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: collapse + user */}
      <div className="border-t border-navy-hover px-2 py-3 space-y-1">
        {(!collapsed || onClose) && (
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-on-navy truncate">{user.name}</p>
              <p className="text-[10px] text-text-on-navy-muted">{formatRole(user.role)}</p>
            </div>
            <button onClick={() => logout().then(() => navigate('/login'))} className="p-1 hover:text-white text-text-on-navy-muted" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Only show collapse toggle on desktop (not in mobile drawer) */}
        {!onClose && (
          <button
            onClick={toggleCollapsed}
            className="sidebar-item w-full text-text-on-navy-muted"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4 mx-auto" />
              : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>
            }
          </button>
        )}
      </div>
    </div>
  );
}

export function AppSidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 transition-[width] duration-200',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
