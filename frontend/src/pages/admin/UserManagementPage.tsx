import { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, Edit, Shield, Trash2, X, ChevronDown, Users, Building2 } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_USERS, MOCK_DEPARTMENTS, saveUsers, saveDepartments } from '../../mocks/data';
import { createDbUser, deleteDbUser, syncAllFromSupabase } from '../../services/dbSync';
import { useAuth } from '../../context/AuthContext';
import { formatRelative } from '../../utils/format';
import type { User } from '../../types/user';

type Role = 'faculty' | 'dept_admin' | 'student' | 'super_admin' | 'ultra_admin';

const ROLES: { value: Role; label: string }[] = [
  { value: 'student',     label: 'Student' },
  { value: 'faculty',     label: 'Faculty' },
  { value: 'dept_admin',  label: 'H.O.D' },
  { value: 'super_admin', label: 'Admin' },
  { value: 'ultra_admin', label: 'Ultra Admin' },
];

function genRollNo(deptCode: string, users: User[]) {
  const existing = users.filter(u => u.department === deptCode && u.role === 'student').length;
  const year = new Date().getFullYear().toString().substring(2);
  return `${deptCode}${year}${String(existing + 1).padStart(3,'0')}`;
}

interface AddUserForm {
  name: string; email: string; password: string;
  role: Role; department: string; subject: string;
  roll_no: string;
}

const EMPTY_FORM: AddUserForm = { name:'', email:'', password:'', role:'student', department:'', subject:'', roll_no:'' };

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const isHod = currentUser?.role === 'dept_admin';
  const hodDept = currentUser?.department;

  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'by-role' | 'by-dept'>('by-role');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddUserForm>(() => ({
    ...EMPTY_FORM,
    department: isHod && hodDept ? hodDept : '',
  }));
  const [editUser, setEditUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    syncAllFromSupabase().then(() => setUsers([...MOCK_USERS]));
  }, []);

  const allowedRoles = isHod ? ROLES.filter(r => r.value === 'student' || r.value === 'faculty') : ROLES;

  const filtered = useMemo(() => users.filter(u => {
    if (isHod && hodDept && u.department !== hodDept) return false;
    const q = search.toLowerCase();
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = !filterRole || u.role === filterRole;
    const matchDept = !filterDept || u.department === filterDept;
    return matchQ && matchRole && matchDept;
  }), [users, search, filterRole, filterDept, isHod, hodDept]);

  const depts = MOCK_DEPARTMENTS.filter(d => d.code !== 'ALL');

  const statusVariant: Record<string, any> = {
    active:'success', inactive:'neutral', exited:'danger', graduated:'neutral',
  };

  async function handleAdd() {
    setError('');
    if (!form.name || !form.email || !form.password || !form.role || !form.department) {
      setError('Please fill in all required fields.'); return;
    }
    if (form.password.length < 4) {
      setError('Password must be at least 4 characters.'); return;
    }
    if (users.some(u => u.email.toLowerCase() === form.email.trim().toLowerCase())) {
      setError('A user with this email already exists.'); return;
    }

    setSaving(true);
    const rollNo = form.role === 'student' ? (form.roll_no || genRollNo(form.department, users)) : '';
    const { user: createdUser, error: dbErr } = await createDbUser(form.email, form.password, {
      email: form.email.trim().toLowerCase(),
      name: form.name.trim(),
      role: form.role,
      department: form.department,
      assigned_subjects: form.subject ? [form.subject] : [],
      special_tags: form.role === 'dept_admin' ? ['HOD'] : [],
      status: 'active',
      last_active_at: new Date().toISOString(),
      last_reauth_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      roll_no: rollNo,
    });
    setSaving(false);

    if (dbErr || !createdUser) {
      setError(dbErr || 'Failed to save user to Supabase database.');
      return;
    }

    MOCK_USERS.push(createdUser);
    saveUsers();

    // Sync with department
    const deptObj = MOCK_DEPARTMENTS.find(d => d.code === form.department);
    if (deptObj) {
      if (form.role === 'student') {
        deptObj.students = [...(deptObj.students || []), {
          uid: createdUser.uid, name: createdUser.name, email: createdUser.email, roll_no: rollNo, year: 1, status: 'active'
        }];
        deptObj.student_count = deptObj.students.length;
      } else if (form.role === 'faculty') {
        deptObj.faculties = [...(deptObj.faculties || []), {
          uid: createdUser.uid, name: createdUser.name, email: createdUser.email, subject: form.subject || undefined, role: 'faculty'
        }];
        deptObj.faculty_count = deptObj.faculties.length;
      } else if (form.role === 'dept_admin') {
        deptObj.hod_id = createdUser.uid;
        deptObj.hod_name = createdUser.name;
      }
      saveDepartments();
    }

    setUsers([...MOCK_USERS]);
    setForm({ ...EMPTY_FORM, department: isHod && hodDept ? hodDept : '' });
    setShowAdd(false);
  }

  function handleDelete(uid: string) {
    const idx = MOCK_USERS.findIndex(u => u.uid === uid);
    if (idx > -1) {
      MOCK_USERS.splice(idx, 1);
      void deleteDbUser(uid);
    }
    setUsers([...MOCK_USERS]);
  }

  function handleEditSave() {
    if (!editUser) return;
    const idx = MOCK_USERS.findIndex(u => u.uid === editUser.uid);
    if (idx > -1) {
      MOCK_USERS[idx] = editUser;
      saveUsers();
    }
    setUsers([...MOCK_USERS]);
    setEditUser(null);
  }

  const selectedDept = depts.find(d => d.code === form.department);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">User Management</h1>
          <p className="text-sm text-text-muted mt-1">Add faculties, HODs and students. {users.length} accounts registered.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setShowAdd(v => !v); setError(''); setForm({ ...EMPTY_FORM, department: isHod && hodDept ? hodDept : '' }); }}>
          <UserPlus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Add User Panel */}
      {showAdd && (
        <div className="card p-5 border border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text">New User</h2>
            <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-bg text-text-muted"><X className="w-4 h-4" /></button>
          </div>
          {error && <div className="mb-3 p-2.5 rounded bg-danger-soft text-danger text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Full Name *</label>
              <input className="input w-full text-sm" placeholder="Dr. Priya Singh" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Email *</label>
              <input className="input w-full text-sm" type="email" placeholder="priya@college.edu" value={form.email} onChange={e => setForm(v => ({...v, email: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Password *</label>
              <input className="input w-full text-sm" type="password" placeholder="Set initial password" value={form.password} onChange={e => setForm(v => ({...v, password: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Role *</label>
              <div className="relative">
                <select className="input w-full text-sm appearance-none pr-8" value={form.role} onChange={e => setForm(v => ({...v, role: e.target.value as Role, subject:'', roll_no:''}))}>
                  {allowedRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Department *</label>
              <div className="relative">
                <select className="input w-full text-sm appearance-none pr-8" value={form.department} onChange={e => setForm(v => ({...v, department: e.target.value, subject:''}))} disabled={isHod}>
                  {!isHod && <option value="">Select department…</option>}
                  {depts.map(d => <option key={d.id} value={d.code}>{d.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
            {form.role === 'faculty' && selectedDept && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Assigned Subject</label>
                <div className="relative">
                  <select className="input w-full text-sm appearance-none pr-8" value={form.subject} onChange={e => setForm(v => ({...v, subject: e.target.value}))}>
                    <option value="">Select subject…</option>
                    {selectedDept.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>
            )}
            {form.role === 'student' && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Roll No. (auto-generated if blank)</label>
                <input className="input w-full text-sm" placeholder={form.department ? genRollNo(form.department, users) : 'Select dept first'} value={form.roll_no} onChange={e => setForm(v => ({...v, roll_no: e.target.value}))} />
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAdd} loading={saving}>Create User</Button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text">Edit User</h2>
              <button onClick={() => setEditUser(null)} className="p-1 hover:bg-bg rounded text-text-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Full Name</label>
                <input className="input w-full text-sm" value={editUser.name} onChange={e => setEditUser(v => v && ({...v, name: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Role</label>
                <div className="relative">
                  <select className="input w-full text-sm appearance-none pr-8" value={editUser.role} onChange={e => setEditUser(v => v && ({...v, role: e.target.value as any}))}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Department</label>
                <div className="relative">
                  <select className="input w-full text-sm appearance-none pr-8" value={editUser.department} onChange={e => setEditUser(v => v && ({...v, department: e.target.value}))}>
                    {depts.map(d => <option key={d.id} value={d.code}>{d.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Status</label>
                <div className="relative">
                  <select className="input w-full text-sm appearance-none pr-8" value={editUser.status} onChange={e => setEditUser(v => v && ({...v, status: e.target.value as any}))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="secondary" size="sm" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleEditSave}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Tabs: All / By Role / By Department */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-bg rounded-lg w-fit border border-border">
          {([
            { id: 'by-role', label: 'By Role', icon: Shield },
            { id: 'by-dept', label: 'By Department', icon: Building2 },
            { id: 'all',     label: 'All Users', icon: Users },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === id ? 'bg-surface shadow text-text' : 'text-text-muted hover:text-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted tabular-nums">
          Showing {filtered.length} of {users.length} users
        </span>
      </div>

      {/* Filters */}
      <div className="card px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="search" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <div className="relative">
          <select className="input w-auto appearance-none pr-8 text-sm" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
        {!isHod && (
          <div className="relative">
            <select className="input w-auto appearance-none pr-8 text-sm" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">All Depts</option>
              <option value="ALL">ALL</option>
              {depts.map(d => <option key={d.id} value={d.code}>{d.code}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        )}
      </div>

      {/* Categorized or Flat User Tables */}
      {(() => {
        const renderTable = (list: User[]) => (
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-bg border-b border-border">
                <tr>
                  {['Name / ID','Email','Role','Dept','Roll No.','Status','Last Sign-in','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-text-muted text-sm">No users found. Click "Add User" to get started.</td></tr>
                )}
                {list.map(u => (
                  <tr key={u.uid} className="border-b border-border hover:bg-bg">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-text">{u.name}</p>
                          <p className="text-[10px] font-mono text-text-muted">{u.uid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={
                        (u.role as string) === 'ultra_admin' ? 'badge bg-navy text-text-on-navy' :
                        u.role === 'super_admin' ? 'badge bg-primary-soft text-primary-hover' :
                        u.role === 'dept_admin'  ? 'badge-info' :
                        u.role === 'faculty'     ? 'badge-success' :
                        'badge-neutral'
                      }>
                        {(u.role as string) === 'ultra_admin' ? 'Ultra Admin' : u.role === 'dept_admin' ? 'H.O.D' : u.role === 'super_admin' ? 'Admin' : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{u.department}</td>
                    <td className="px-4 py-3 text-text-muted font-mono text-xs">{(u as any).roll_no || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge variant={statusVariant[u.status] ?? 'neutral'} label={u.status} /></td>
                    <td className="px-4 py-3 text-xs text-text-muted">{formatRelative(u.last_active_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditUser({...u})} className="p-1.5 rounded hover:bg-bg text-text-muted" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 rounded hover:bg-bg text-text-muted" title="Permissions"><Shield className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(u.uid)} className="p-1.5 rounded hover:bg-danger-soft text-danger" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

        if (viewMode === 'all') return renderTable(filtered);

        if (viewMode === 'by-role') {
          const roleOrder: { key: string; label: string }[] = [
            { key: 'ultra_admin', label: 'Ultra Admin' },
            { key: 'super_admin', label: 'Admin' },
            { key: 'dept_admin',  label: 'H.O.D' },
            { key: 'faculty',     label: 'Faculty' },
            { key: 'student',     label: 'Student' },
          ];
          const nonEmpty = roleOrder.filter(r => filtered.some(u => u.role === r.key));
          if (nonEmpty.length === 0) return renderTable([]);
          return (
            <div className="space-y-5">
              {nonEmpty.map(r => {
                const group = filtered.filter(u => u.role === r.key);
                return (
                  <div key={r.key} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <h2 className="text-sm font-semibold text-text">{r.label}</h2>
                      <span className="badge-neutral tabular-nums">{group.length}</span>
                    </div>
                    {renderTable(group)}
                  </div>
                );
              })}
            </div>
          );
        }

        // By Department
        const deptGroups = Array.from(new Set(filtered.map(u => u.department || 'Unassigned')));
        if (deptGroups.length === 0) return renderTable([]);
        return (
          <div className="space-y-5">
            {deptGroups.map(code => {
              const group = filtered.filter(u => (u.department || 'Unassigned') === code);
              const deptName = depts.find(d => d.code === code)?.name;
              return (
                <div key={code} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <h2 className="text-sm font-semibold text-text">
                      {deptName ? `${deptName} (${code})` : code}
                    </h2>
                    <span className="badge-info tabular-nums">{group.length}</span>
                  </div>
                  {renderTable(group)}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
