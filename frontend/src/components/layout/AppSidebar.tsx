import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Files, Users, Building2, Shield, Tag, KeyRound, ScrollText,
  Inbox, FlaskConical, MonitorSmartphone, OctagonAlert, Activity, History,
  Settings, BookOpen, FileText, ChevronLeft, ChevronRight, LogOut, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/format';
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
        { label: 'Roles',         to: '/admin/roles',       icon: Shield },
        { label: 'Special Tags',  to: '/admin/tags',        icon: Tag },
    ]},
    { group: 'Content', items: [{ label: 'Documents', to: '/admin/documents', icon: Files }] },
    { group: 'Access Control', items: [
        { label: 'Permissions',   to: '/admin/permissions', icon: KeyRound },
        { label: 'Policies',      to: '/admin/policies',    icon: ScrollText },
        { label: 'Requests',      to: '/admin/requests',    icon: Inbox },
        { label: 'Simulator',     to: '/admin/simulator',   icon: FlaskConical },
    ]},
    { group: 'Security', items: [
        { label: 'Sessions',      to: '/admin/sessions',    icon: MonitorSmartphone },
        { label: 'Emergency',     to: '/admin/emergency',   icon: OctagonAlert },
        { label: 'Monitoring',    to: '/admin/security',    icon: Activity },
        { label: 'Audit Logs',    to: '/admin/audit',       icon: History },
    ]},
    { group: 'System', items: [{ label: 'Settings', to: '/admin/settings', icon: Settings }] },
  ];
}

function userNav(role: Role): NavGroup[] {
  const items: NavItem[] = [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }];
  items.push({ label: 'Document Library', to: '/library', icon: Files });
  if (role === 'dept_admin') items.push({ label: 'Dept Activity', to: '/department/activity', icon: Activity });
  items.push({ label: 'My Permissions', to: '/permissions', icon: KeyRound });
  items.push({ label: 'Access Requests', to: '/requests', icon: Inbox });
  items.push({ label: 'Notifications', to: '/notifications', icon: Inbox });
  items.push({ label: 'Profile', to: '/profile', icon: User });
  return [{ group: 'Navigation', items }];
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user.role === 'super_admin';
  const groups = isAdmin ? adminNav() : userNav(user.role);

  return (
    <aside className={cn(
      'flex flex-col bg-navy text-text-on-navy transition-all duration-200 flex-shrink-0',
      collapsed ? 'w-[72px]' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-navy-hover">
        <Shield className="w-6 h-6 text-primary flex-shrink-0" strokeWidth={2} />
        {!collapsed && (
          <div>
            <span className="text-sm font-semibold text-white">CampusShield</span>
            <p className="text-[10px] text-text-on-navy-muted leading-none mt-0.5">Zero-Trust Platform</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {groups.map(({ group, items }) => (
          <div key={group}>
            {!collapsed && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-on-navy-muted px-2 mb-1">{group}</p>
            )}
            {items.map(({ label, to, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className={({ isActive }) =>
                  cn('sidebar-item', isActive && 'sidebar-item-active', collapsed && 'justify-center px-2')
                }
                title={collapsed ? label : undefined}
              >
                <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                {!collapsed && <span className="flex-1">{label}</span>}
                {!collapsed && badge !== undefined && badge > 0 && (
                  <span className="ml-auto text-[10px] font-semibold bg-primary text-white rounded-full px-1.5 py-0.5">{badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: collapse + user */}
      <div className="border-t border-navy-hover px-2 py-3 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-on-navy truncate">{user.name}</p>
              <p className="text-[10px] text-text-on-navy-muted capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            <button onClick={() => logout().then(() => navigate('/login'))} className="p-1 hover:text-white text-text-on-navy-muted" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="sidebar-item w-full text-text-on-navy-muted"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4 mx-auto" />
            : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
