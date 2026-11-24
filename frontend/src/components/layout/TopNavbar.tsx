import React from 'react';
import { Bell, Search, ChevronRight, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';

function useBreadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    path: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));
}

export function TopNavbar() {
  const { user } = useAuth();
  const { setMobileOpen } = useSidebar();
  const crumbs = useBreadcrumbs();

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-20">
      {/* Hamburger — mobile only */}
      <button
        className="lg:hidden p-2 rounded hover:bg-bg text-text-muted flex-shrink-0"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-text-muted flex-1 min-w-0 overflow-x-auto" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
            {crumb.isLast
              ? <span className="text-text font-medium truncate">{crumb.label}</span>
              : <Link to={crumb.path} className="hover:text-text truncate whitespace-nowrap">{crumb.label}</Link>
            }
          </React.Fragment>
        ))}
      </nav>

      {/* Search hint — hidden on small screens */}
      <button className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted border border-border rounded hover:border-primary/50 transition-colors flex-shrink-0">
        <Search className="w-4 h-4" />
        <span>Search…</span>
        <kbd className="text-[10px] border border-border rounded px-1 ml-2">/</kbd>
      </button>

      {/* Notifications */}
      <button className="relative p-2 rounded hover:bg-bg text-text-muted flex-shrink-0" aria-label="Notifications">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" aria-hidden="true" />
      </button>

      {/* Avatar */}
      {user && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-semibold">
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs font-medium text-text leading-none">{user.name}</p>
            <p className="text-[10px] text-text-muted capitalize mt-0.5">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
      )}
    </header>
  );
}
