import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Users, GraduationCap, BookOpen, Edit, X, ChevronDown, Search } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_USERS, MOCK_DEPARTMENTS, saveUsers } from '../../mocks/data';
import { formatRole } from '../../constants/roles';
import { syncAllFromSupabase } from '../../services/dbSync';
import type { User } from '../../types/user';

type TabKey = 'admins' | 'hods' | 'faculties';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{className?:string}>; role: string[] }[] = [
  { key: 'admins',    label: 'Admins',    icon: Shield,         role: ['super_admin','ultra_admin'] },
  { key: 'hods',      label: 'H.O.Ds',    icon: GraduationCap,  role: ['dept_admin'] },
  { key: 'faculties', label: 'Faculties', icon: BookOpen,       role: ['faculty'] },
];

const ALL_ROLES = [
  { value: 'student',     label: 'Student' },
  { value: 'faculty',     label: 'Faculty' },
  { value: 'dept_admin',  label: 'H.O.D' },
  { value: 'super_admin', label: 'Admin' },
  { value: 'ultra_admin', label: 'Ultra Admin' },
];

export default function RoleManagementPage() {
  const [tab, setTab] = useState<TabKey>('admins');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    syncAllFromSupabase().then(() => setUsers([...MOCK_USERS]));
  }, []);

  const currentTab = TABS.find(t => t.key === tab)!;

  const filtered = useMemo(() => {
    const roleSet = new Set(currentTab.role);
    return users.filter(u => {
      const matchRole = roleSet.has(u.role);
      const q = search.toLowerCase();
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchRole && matchQ;
    });
  }, [users, tab, search, currentTab.role]);

  function openEdit(u: User) {
    setEditUser({ ...u });
    setNewRole(u.role);
  }

  function saveRole() {
    if (!editUser || !newRole) return;
    const idx = MOCK_USERS.findIndex(u => u.uid === editUser.uid);
    if (idx > -1) {
      MOCK_USERS[idx] = { ...MOCK_USERS[idx], role: newRole as any, special_tags: newRole === 'dept_admin' ? ['HOD'] : [] };
      saveUsers();
    }
    setUsers([...MOCK_USERS]);
    setEditUser(null);
  }

  const depts = MOCK_DEPARTMENTS.filter(d => d.code !== 'ALL');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-text">Role Management</h1>
        <p className="text-sm text-text-muted mt-1">View and change roles for Admins, HODs, and Faculties.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg rounded-lg w-fit border border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-surface shadow text-text' : 'text-text-muted hover:text-text'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              tab === t.key ? 'bg-primary text-white' : 'bg-border text-text-muted'
            }`}>
              {users.filter(u => currentTab.role.includes(u.role)).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card px-4 py-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            placeholder={`Search ${currentTab.label.toLowerCase()}…`}
            className="input pl-9 w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Edit Role Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text">Change Role — {editUser.name}</h2>
              <button onClick={() => setEditUser(null)} className="p-1 hover:bg-bg rounded text-text-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Current Role</label>
                <p className="text-sm font-medium text-text">{formatRole(editUser.role)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">New Role</label>
                <div className="relative">
                  <select className="input w-full text-sm appearance-none pr-8" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    {ALL_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>
              {newRole === 'dept_admin' && (
                <div className="p-3 rounded bg-info-soft text-info text-xs">
                  Changing to HOD will assign the HOD tag and grant department-level admin access.
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="secondary" size="sm" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={saveRole} disabled={newRole === editUser.role}>Save Role</Button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-bg border-b border-border">
            <tr>
              {['Name','Email','Department','Role','Status','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted text-sm">
                  No {currentTab.label.toLowerCase()} found. Add users from the Users page.
                </td>
              </tr>
            )}
            {filtered.map(u => (
              <tr key={u.uid} className="border-b border-border hover:bg-bg">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-white text-xs font-semibold">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-text">{u.name}</p>
                      <p className="text-[10px] font-mono text-text-muted">{u.uid}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-muted">{u.email}</td>
                <td className="px-4 py-3 text-text-muted">{u.department || '—'}</td>
                <td className="px-4 py-3">
                  <span className={
                    (u.role as string) === 'ultra_admin' || u.role === 'super_admin' ? 'badge bg-primary-soft text-primary-hover' :
                    u.role === 'dept_admin'  ? 'badge-info' :
                    u.role === 'faculty'     ? 'badge-success' :
                    'badge-neutral'
                  }>
                    {formatRole(u.role)}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge variant={u.status === 'active' ? 'success' : 'neutral'} label={u.status} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(u)} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                    <Edit className="w-3.5 h-3.5" /> Change Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
