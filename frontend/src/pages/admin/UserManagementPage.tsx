import { useState, useMemo } from 'react';
import { Search, UserPlus, Edit, Shield, Trash2, X, ChevronDown } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_USERS, MOCK_DEPARTMENTS, MOCK_CREDENTIALS, saveUsers, saveDepartments } from '../../mocks/data';
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

function genId(role: string) {
  return `usr_${role.substring(0,3)}_${Math.random().toString(36).substring(2,7)}`;
}
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
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddUserForm>(EMPTY_FORM);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = !filterRole || u.role === filterRole;
    const matchDept = !filterDept || u.department === filterDept;
    return matchQ && matchRole && matchDept;
  }), [users, search, filterRole, filterDept]);

  const depts = MOCK_DEPARTMENTS.filter(d => d.code !== 'ALL');

  const statusVariant: Record<string, any> = {
    active:'success', inactive:'neutral', exited:'danger', graduated:'neutral',
  };

  function handleAdd() {
    setError('');
    if (!form.name || !form.email || !form.password || !form.role || !form.department) {
      setError('Please fill in all required fields.'); return;
    }
    if (users.some(u => u.email === form.email)) {
      setError('A user with this email already exists.'); return;
    }
    const uid = genId(form.role);
    const rollNo = form.role === 'student' ? (form.roll_no || genRollNo(form.department, users)) : '';
    const newUser: User = {
      uid,
      email: form.email,
      name: form.name,
      role: form.role,
      department: form.department,
      assigned_subjects: form.subject ? [form.subject] : [],
      special_tags: form.role === 'dept_admin' ? ['HOD'] : [],
      status: 'active',
      last_active_at: new Date().toISOString(),
      last_reauth_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      roll_no: rollNo,
    } as any;
    // Store credential for demo login
    MOCK_CREDENTIALS[form.email] = { password: form.password, uid };
    // Update global mock array & persist
    MOCK_USERS.push(newUser);
    saveUsers();

    // Sync with department
    const deptObj = MOCK_DEPARTMENTS.find(d => d.code === form.department);
    if (deptObj) {
      if (form.role === 'student') {
        deptObj.students = [...(deptObj.students || []), {
          uid, name: form.name, email: form.email, roll_no: rollNo, year: 1, status: 'active'
        }];
        deptObj.student_count = deptObj.students.length;
      } else if (form.role === 'faculty') {
        deptObj.faculties = [...(deptObj.faculties || []), {
          uid, name: form.name, email: form.email, subject: form.subject || undefined, role: 'faculty'
        }];
        deptObj.faculty_count = deptObj.faculties.length;
      } else if (form.role === 'dept_admin') {
        deptObj.hod_id = uid;
        deptObj.hod_name = form.name;
      }
      saveDepartments();
    }

    setUsers([...MOCK_USERS]);
    setForm(EMPTY_FORM);
    setShowAdd(false);
  }

  function handleDelete(uid: string) {
    const idx = MOCK_USERS.findIndex(u => u.uid === uid);
    if (idx > -1) {
      const removed = MOCK_USERS[idx];
      delete MOCK_CREDENTIALS[removed.email];
      MOCK_USERS.splice(idx, 1);
      saveUsers();
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
        <Button variant="primary" size="sm" onClick={() => { setShowAdd(v => !v); setError(''); setForm(EMPTY_FORM); }}>
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
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Department *</label>
              <div className="relative">
                <select className="input w-full text-sm appearance-none pr-8" value={form.department} onChange={e => setForm(v => ({...v, department: e.target.value, subject:''}))}>
                  <option value="">Select department…</option>
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
            <Button variant="primary" size="sm" onClick={handleAdd}>Create User</Button>
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
        <div className="relative">
          <select className="input w-auto appearance-none pr-8 text-sm" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Depts</option>
            {depts.map(d => <option key={d.id} value={d.code}>{d.code}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
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
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-text-muted text-sm">No users found. Click "Add User" to get started.</td></tr>
            )}
            {filtered.map(u => (
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
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    (u.role as string) === 'ultra_admin' ? 'bg-purple-200 text-purple-900' :
                    u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'dept_admin'  ? 'bg-blue-100 text-blue-700' :
                    u.role === 'faculty'     ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {(u.role as string) === 'ultra_admin' ? 'Ultra Admin' : u.role === 'dept_admin' ? 'HOD' : u.role === 'super_admin' ? 'Admin' : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
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
    </div>
  );
}
