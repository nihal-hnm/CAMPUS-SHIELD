import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, User, FileText, Edit2, X, ChevronDown, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge, ClassificationBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/feedback/States';
import { MOCK_USERS, MOCK_DOCUMENTS, MOCK_PERMISSIONS, savePermissions } from '../../mocks/data';
import { useAuth } from '../../context/AuthContext';
import type { Permission, PermissionLevel } from '../../types/permission';
import { formatDate, formatCountdown } from '../../utils/format';

const LEVELS: PermissionLevel[] = ['View', 'Download', 'Share', 'Edit'];

// ── Grant Permission Modal ────────────────────────────────────────────────────
function GrantModal({ onClose, onGrant, hodDept }: { onClose: () => void; onGrant: (p: Permission) => void; hodDept?: string }) {
  const { user } = useAuth();
  const [userId, setUserId] = useState('');
  const [docId, setDocId] = useState('');
  const [level, setLevel] = useState<PermissionLevel>('View');
  const [expires, setExpires] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [docSearch, setDocSearch] = useState('');

  const filteredUsers = MOCK_USERS.filter(u =>
    (!hodDept || u.department === hodDept) &&
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase()))
  );
  const filteredDocs = MOCK_DOCUMENTS.filter(d =>
    (!hodDept || d.department === hodDept) &&
    (d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.department.toLowerCase().includes(docSearch.toLowerCase()))
  );

  const selectedUser = MOCK_USERS.find(u => u.uid === userId);
  const selectedDoc = MOCK_DOCUMENTS.find(d => d.document_id === docId);

  function handleGrant() {
    if (!userId || !docId) return;
    const perm: Permission = {
      id: `perm_${Date.now()}`,
      user_id: userId,
      user_name: selectedUser?.name,
      resource_id: docId,
      resource_title: selectedDoc?.title,
      resource_type: 'document',
      level,
      source: 'Direct',
      granted_by: user?.uid ?? 'usr_admin_001',
      granted_by_name: user?.name ?? 'Admin',
      granted_on: new Date().toISOString(),
      expires_at: expires ? new Date(expires).toISOString() : undefined,
      status: 'active',
    };
    onGrant(perm);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/40" onClick={onClose} />
      <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Grant Permission</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg text-text-muted"><X className="w-4 h-4" /></button>
        </div>

        {/* User picker */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Select User *</label>
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input className="input pl-8 w-full text-sm" placeholder="Search users…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </div>
          <div className="border border-border rounded max-h-36 overflow-y-auto">
            {filteredUsers.map(u => (
              <button
                key={u.uid}
                onClick={() => setUserId(u.uid)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-bg flex items-center gap-2 ${userId === u.uid ? 'bg-primary-soft' : ''}`}
              >
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">{u.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text truncate">{u.name}</p>
                  <p className="text-[10px] text-text-muted truncate">{u.email} · {u.role.replace('_', ' ')} · {u.department}</p>
                </div>
                {userId === u.uid && <span className="text-primary text-xs">✓</span>}
              </button>
            ))}
            {filteredUsers.length === 0 && <p className="text-sm text-text-muted text-center py-3">No users found</p>}
          </div>
        </div>

        {/* Document picker */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Select Document *</label>
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input className="input pl-8 w-full text-sm" placeholder="Search documents…" value={docSearch} onChange={e => setDocSearch(e.target.value)} />
          </div>
          <div className="border border-border rounded max-h-36 overflow-y-auto">
            {filteredDocs.map(d => (
              <button
                key={d.document_id}
                onClick={() => setDocId(d.document_id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-bg flex items-center gap-2 ${docId === d.document_id ? 'bg-primary-soft' : ''}`}
              >
                <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text truncate">{d.title}</p>
                  <p className="text-[10px] text-text-muted truncate">{d.department} · {d.classification}</p>
                </div>
                {docId === d.document_id && <span className="text-primary text-xs">✓</span>}
              </button>
            ))}
            {filteredDocs.length === 0 && <p className="text-sm text-text-muted text-center py-3">No documents found</p>}
          </div>
        </div>

        {/* Level + Expiry */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Access Level</label>
            <div className="relative">
              <select className="input w-full text-sm appearance-none pr-8" value={level} onChange={e => setLevel(e.target.value as PermissionLevel)}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Expires (optional)</label>
            <input type="date" className="input w-full text-sm" value={expires} min={new Date().toISOString().slice(0, 10)} onChange={e => setExpires(e.target.value)} />
          </div>
        </div>

        {/* Summary */}
        {selectedUser && selectedDoc && (
          <div className="bg-primary-soft border border-primary/20 rounded p-3 text-xs text-text">
            <p className="font-medium text-primary mb-1">Grant Summary</p>
            <p><strong>{selectedUser.name}</strong> will get <strong>{level}</strong> access to <strong>{selectedDoc.title}</strong>{expires ? ` until ${expires}` : ' indefinitely'}.</p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" className="flex-1" onClick={handleGrant} disabled={!userId || !docId}>Grant Permission</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PermissionMgmtPage() {
  const { user } = useAuth();
  const isHod = user?.role === 'dept_admin';
  const hodDept = user?.department;

  const [permissions, setPermissions] = useState<Permission[]>(MOCK_PERMISSIONS);
  const [showGrant, setShowGrant] = useState(false);
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDoc, setFilterDoc] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [tab, setTab] = useState<'all' | 'by-user' | 'by-doc'>('all');

  const filtered = useMemo(() => {
    let list = permissions;
    if (isHod && hodDept) {
      list = list.filter(p => {
        const doc = MOCK_DOCUMENTS.find(d => d.document_id === p.resource_id);
        const targetUser = MOCK_USERS.find(u => u.uid === p.user_id);
        return doc?.department === hodDept || targetUser?.department === hodDept;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.user_name ?? '').toLowerCase().includes(q) ||
        (p.resource_title ?? '').toLowerCase().includes(q)
      );
    }
    if (filterUser) list = list.filter(p => p.user_id === filterUser);
    if (filterDoc)  list = list.filter(p => p.resource_id === filterDoc);
    if (filterLevel) list = list.filter(p => p.level === filterLevel);
    return list;
  }, [permissions, search, filterUser, filterDoc, filterLevel]);

  function revoke(id: string) {
    const idx = MOCK_PERMISSIONS.findIndex(p => p.id === id);
    if (idx > -1) {
      MOCK_PERMISSIONS.splice(idx, 1);
      savePermissions();
    }
    setPermissions([...MOCK_PERMISSIONS]);
  }

  function handleGrant(perm: Permission) {
    MOCK_PERMISSIONS.unshift(perm);
    savePermissions();
    setPermissions([...MOCK_PERMISSIONS]);
  }

  // Group by user for the by-user tab
  const byUser = useMemo(() => {
    const map: Record<string, Permission[]> = {};
    filtered.forEach(p => { (map[p.user_id] ??= []).push(p); });
    return map;
  }, [filtered]);

  // Group by document
  const byDoc = useMemo(() => {
    const map: Record<string, Permission[]> = {};
    filtered.forEach(p => { (map[p.resource_id] ??= []).push(p); });
    return map;
  }, [filtered]);

  const levelColor: Record<string, string> = {
    View: 'bg-blue-50 text-blue-700 border-blue-200',
    Download: 'bg-green-50 text-green-700 border-green-200',
    Share: 'bg-purple-50 text-purple-700 border-purple-200',
    Edit: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className="space-y-5">
      {showGrant && <GrantModal onClose={() => setShowGrant(false)} onGrant={handleGrant} hodDept={isHod ? hodDept : undefined} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Permission Management</h1>
          <p className="text-sm text-text-muted mt-1">Grant, modify and revoke access to documents for users. {permissions.length} active permissions.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowGrant(true)}>
          <Plus className="w-4 h-4" /> Grant Permission
        </Button>
      </div>

      {/* Filters */}
      <div className="card px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            placeholder="Search by user or document…"
            className="input pl-9 w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input text-sm" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
          <option value="">All Users</option>
          {MOCK_USERS.map(u => <option key={u.uid} value={u.uid}>{u.name} ({u.role.replace('_',' ')})</option>)}
        </select>
        <select className="input text-sm" value={filterDoc} onChange={e => setFilterDoc(e.target.value)}>
          <option value="">All Documents</option>
          {MOCK_DOCUMENTS.map(d => <option key={d.document_id} value={d.document_id}>{d.title}</option>)}
        </select>
        <select className="input text-sm" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
          <option value="">All Levels</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['all', 'by-user', 'by-doc'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'}`}
          >
            {t === 'all' ? 'All Permissions' : t === 'by-user' ? 'View by User' : 'View by Document'}
          </button>
        ))}
      </div>

      {/* ── All Permissions Table ── */}
      {tab === 'all' && (
        filtered.length === 0 ? <EmptyState title="No permissions found" description="Adjust filters or grant a new permission." /> : (
          <div className="card overflow-hidden overflow-x-auto p-0">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-bg border-b border-border">
                <tr>
                  {['User', 'Document', 'Level', 'Source', 'Granted On', 'Expires', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const user = MOCK_USERS.find(u => u.uid === p.user_id);
                  const doc = MOCK_DOCUMENTS.find(d => d.document_id === p.resource_id);
                  return (
                    <tr key={p.id} className="border-b border-border hover:bg-bg">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{(p.user_name ?? '?')[0]}</div>
                          <div>
                            <p className="font-medium text-text text-xs">{p.user_name ?? p.user_id}</p>
                            <p className="text-[10px] text-text-muted">{user?.role.replace('_', ' ')} · {user?.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-text truncate max-w-[180px]">{p.resource_title ?? p.resource_id}</p>
                            {doc && <span className="text-[10px] text-text-muted">{doc.department}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${levelColor[p.level] ?? 'bg-bg text-text-muted border-border'}`}>{p.level}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">{p.source}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">{formatDate(p.granted_on)}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {p.expires_at ? (
                          <span className={new Date(p.expires_at) < new Date() ? 'text-danger' : 'text-warning'}>
                            {formatCountdown(p.expires_at)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={p.status === 'active' ? 'success' : 'danger'} label={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => revoke(p.id)}
                          className="p-1.5 rounded hover:bg-danger-soft text-text-muted hover:text-danger transition-colors"
                          title="Revoke permission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── By User ── */}
      {tab === 'by-user' && (
        Object.keys(byUser).length === 0 ? <EmptyState title="No permissions found" /> : (
          <div className="space-y-4">
            {Object.entries(byUser).map(([uid, perms]) => {
              const user = MOCK_USERS.find(u => u.uid === uid);
              return (
                <div key={uid} className="card p-0 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-bg border-b border-border">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">{user?.name[0] ?? '?'}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-text text-sm">{user?.name ?? uid}</p>
                      <p className="text-xs text-text-muted">{user?.email} · {user?.role.replace('_', ' ')} · {user?.department}</p>
                    </div>
                    <span className="text-xs text-text-muted">{perms.length} permission{perms.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {perms.map(p => {
                      const doc = MOCK_DOCUMENTS.find(d => d.document_id === p.resource_id);
                      return (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg">
                          <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text truncate">{p.resource_title}</p>
                            {doc && <div className="flex items-center gap-2 mt-0.5"><ClassificationBadge classification={doc.classification} /><span className="text-[10px] text-text-muted">{doc.department}</span></div>}
                          </div>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${levelColor[p.level] ?? ''}`}>{p.level}</span>
                          <button onClick={() => revoke(p.id)} className="p-1.5 rounded hover:bg-danger-soft text-text-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── By Document ── */}
      {tab === 'by-doc' && (
        Object.keys(byDoc).length === 0 ? <EmptyState title="No permissions found" /> : (
          <div className="space-y-4">
            {Object.entries(byDoc).map(([docId, perms]) => {
              const doc = MOCK_DOCUMENTS.find(d => d.document_id === docId);
              return (
                <div key={docId} className="card p-0 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-bg border-b border-border">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-text text-sm">{doc?.title ?? docId}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {doc && <ClassificationBadge classification={doc.classification} />}
                        <span className="text-xs text-text-muted">{doc?.department}</span>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted">{perms.length} user{perms.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {perms.map(p => {
                      const user = MOCK_USERS.find(u => u.uid === p.user_id);
                      return (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg">
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{(p.user_name ?? '?')[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text">{p.user_name}</p>
                            <p className="text-[10px] text-text-muted">{user?.role.replace('_', ' ')} · {user?.department}</p>
                          </div>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${levelColor[p.level] ?? ''}`}>{p.level}</span>
                          {p.expires_at && <span className="text-[10px] text-warning">exp {formatCountdown(p.expires_at)}</span>}
                          <button onClick={() => revoke(p.id)} className="p-1.5 rounded hover:bg-danger-soft text-text-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
