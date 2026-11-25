import { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronRight, Menu, X, FileText, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { MOCK_DOCUMENTS, MOCK_USERS, MOCK_PERMISSIONS } from '../../mocks/data';
import { formatRole } from '../../constants/roles';
import { sameDepartment } from '../../utils/format';

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
  const navigate = useNavigate();
  const crumbs = useBreadcrumbs();

  // ── Global search ─────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Open on "/" keypress
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  const q = query.toLowerCase().trim();
  const isAdmin = user?.role === 'super_admin' || (user?.role as string) === 'ultra_admin';
  const docResults = q.length > 1
    ? MOCK_DOCUMENTS.filter(d => {
        if (!isAdmin) {
          const hasPerm = MOCK_PERMISSIONS.some(p => p.user_id === user?.uid && p.resource_id === d.document_id && p.status === 'active');
          if (!sameDepartment(d.department, user?.department) && !hasPerm) return false;
        }
        return d.title.toLowerCase().includes(q) || d.department.toLowerCase().includes(q) || (d.subject_id ?? '').toLowerCase().includes(q);
      }).slice(0, 5)
    : [];
  const userResults = q.length > 1 && user?.role !== 'student'
    ? MOCK_USERS.filter(u => {
        if (!isAdmin && !sameDepartment(u.department, user?.department)) return false;
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
      }).slice(0, 4)
    : [];

  function handleDocClick(docId: string) {
    navigate(`/documents/${docId}`);
    setSearchOpen(false);
    setQuery('');
  }

  return (
    <>
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
            <ChevronRight key={crumb.path + i} className={i === 0 ? 'hidden' : 'w-3.5 h-3.5 flex-shrink-0'} />
          ))}
          {crumbs.map((crumb, i) => (
            crumb.isLast
              ? <span key={crumb.path} className="text-text font-medium truncate">{crumb.label}</span>
              : <Link key={crumb.path} to={crumb.path} className="hover:text-text truncate whitespace-nowrap">{crumb.label}</Link>
          ))}
        </nav>

        {/* Search button */}
        <button
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted border border-border rounded hover:border-primary/50 transition-colors flex-shrink-0"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
        >
          <Search className="w-4 h-4" />
          <span>Search…</span>
          <kbd className="text-[10px] border border-border rounded px-1 ml-2">/</kbd>
        </button>
        {/* Mobile search icon */}
        <button className="md:hidden p-2 rounded hover:bg-bg text-text-muted flex-shrink-0" onClick={() => setSearchOpen(true)}><Search className="w-4 h-4" /></button>

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
              <p className="text-[10px] text-text-muted mt-0.5">{formatRole(user.role)}</p>
            </div>
          </div>
        )}
      </header>

      {/* ── Global Search Overlay ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4">
          <div className="absolute inset-0 bg-navy/40" onClick={() => { setSearchOpen(false); setQuery(''); }} />
          <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
                placeholder="Search documents, users, departments…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoComplete="off"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-0.5 rounded hover:bg-bg text-text-muted">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="text-[10px] border border-border rounded px-1 text-text-muted">Esc</kbd>
            </div>

            {/* Results */}
            {q.length > 1 && (
              <div className="max-h-80 overflow-y-auto">
                {docResults.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wide border-b border-border">Documents</p>
                    {docResults.map(doc => (
                      <button
                        key={doc.document_id}
                        onClick={() => handleDocClick(doc.document_id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg text-left border-b border-border last:border-0"
                      >
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{doc.title}</p>
                          <p className="text-[10px] text-text-muted">{doc.department} · {doc.classification}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {userResults.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wide border-b border-border">Users</p>
                    {userResults.map(u => (
                      <div key={u.uid} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0">
                        <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{u.name[0]}</div>
                        <div>
                          <p className="text-sm font-medium text-text">{u.name}</p>
                          <p className="text-[10px] text-text-muted">{u.email} · {formatRole(u.role)} · {u.department}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {docResults.length === 0 && userResults.length === 0 && (
                  <div className="py-10 text-center text-sm text-text-muted">No results found for "<strong>{query}</strong>"</div>
                )}
              </div>
            )}

            {q.length <= 1 && (
              <div className="px-4 py-6 text-center text-sm text-text-muted">
                Start typing to search documents and users…
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
