import { useState, useMemo } from 'react';
import {
  Building2, Users, BookOpen, Search, Plus, Edit, ChevronDown, ChevronUp,
  X, GraduationCap, UserCheck, Hash, Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MOCK_DEPARTMENTS, MOCK_USERS, type Department, type Student } from '../../mocks/data';

type DeptTab = 'subjects' | 'students' | 'faculty';

const STUDENT_STORE: Record<string, Student[]> = {};

function genRoll(deptCode: string, existing: Student[]) {
  const year = new Date().getFullYear().toString().substring(2);
  return `${deptCode}${year}${String(existing.length + 1).padStart(3, '0')}`;
}

export default function DepartmentMgmtPage() {
  const [departments, setDepartments] = useState<Department[]>(
    MOCK_DEPARTMENTS.filter(d => d.code !== 'ALL')
  );
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deptTab, setDeptTab] = useState<Record<string, DeptTab>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '', subjects: '' });

  // Student state per dept
  const [students, setStudents] = useState<Record<string, Student[]>>(STUDENT_STORE);
  const [showAddStudent, setShowAddStudent] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', roll_no: '', year: 1 });

  // Faculty assignment
  const [showAssignFaculty, setShowAssignFaculty] = useState<string | null>(null);
  const [assignFacultyUid, setAssignFacultyUid] = useState('');
  const [assignSubject, setAssignSubject] = useState('');

  // HOD assignment
  const [showAssignHod, setShowAssignHod] = useState<string | null>(null);
  const [assignHodUid, setAssignHodUid] = useState('');

  const filtered = useMemo(() => departments.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
  ), [departments, search]);

  function handleAdd() {
    if (!newDept.name || !newDept.code) return;
    const dept: Department = {
      id: `dept_${newDept.code.toLowerCase()}`,
      name: newDept.name,
      code: newDept.code.toUpperCase(),
      subjects: newDept.subjects.split(',').map(s => s.trim()).filter(Boolean),
      student_count: 0, faculty_count: 0, status: 'active', faculties: [],
    };
    MOCK_DEPARTMENTS.push(dept);
    setDepartments([...MOCK_DEPARTMENTS.filter(d => d.code !== 'ALL')]);
    setNewDept({ name: '', code: '', subjects: '' });
    setShowAdd(false);
  }

  function addStudent(deptId: string, deptCode: string) {
    if (!newStudent.name || !newStudent.email) return;
    const existing = students[deptId] || [];
    const roll = newStudent.roll_no || genRoll(deptCode, existing);
    const s: Student = {
      uid: `stu_${Math.random().toString(36).substring(2,8)}`,
      name: newStudent.name, email: newStudent.email,
      roll_no: roll, year: newStudent.year, status: 'active',
    };
    const updated = { ...students, [deptId]: [...existing, s] };
    STUDENT_STORE[deptId] = updated[deptId];
    setStudents(updated);
    // Update dept student count
    setDepartments(prev => prev.map(d => d.id === deptId ? {...d, student_count: (students[deptId]?.length || 0) + 1} : d));
    setNewStudent({ name:'', email:'', roll_no:'', year:1 });
    setShowAddStudent(null);
  }

  function assignFaculty(deptId: string) {
    const user = MOCK_USERS.find(u => u.uid === assignFacultyUid);
    if (!user) return;
    setDepartments(prev => prev.map(d => {
      if (d.id !== deptId) return d;
      const faculties = d.faculties || [];
      if (faculties.some(f => f.uid === user.uid)) return d;
      return {
        ...d,
        faculties: [...faculties, { uid: user.uid, name: user.name, email: user.email, subject: assignSubject, role: 'faculty' }],
        faculty_count: (d.faculty_count || 0) + 1,
      };
    }));
    setAssignFacultyUid(''); setAssignSubject(''); setShowAssignFaculty(null);
  }

  function assignHod(deptId: string) {
    const user = MOCK_USERS.find(u => u.uid === assignHodUid);
    if (!user) return;
    setDepartments(prev => prev.map(d => {
      if (d.id !== deptId) return d;
      return { ...d, hod_id: user.uid, hod_name: user.name };
    }));
    setAssignHodUid(''); setShowAssignHod(null);
  }

  function removeFaculty(deptId: string, uid: string) {
    setDepartments(prev => prev.map(d => {
      if (d.id !== deptId) return d;
      return { ...d, faculties: (d.faculties || []).filter(f => f.uid !== uid), faculty_count: Math.max(0, d.faculty_count - 1) };
    }));
  }

  function removeStudent(deptId: string, uid: string) {
    const updated = { ...students, [deptId]: (students[deptId] || []).filter(s => s.uid !== uid) };
    setStudents(updated);
    setDepartments(prev => prev.map(d => d.id === deptId ? {...d, student_count: Math.max(0, d.student_count - 1)} : d));
  }

  const facultyUsers = MOCK_USERS.filter(u => u.role === 'faculty' || u.role === 'dept_admin');
  const hodUsers = MOCK_USERS.filter(u => u.role === 'dept_admin' || u.role === 'faculty');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Department Management</h1>
          <p className="text-sm text-text-muted mt-1">Manage departments, HODs, faculties and student lists. {departments.length} departments.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(v => !v)}>
          <Plus className="w-4 h-4" /> Add Department
        </Button>
      </div>

      {/* Add Dept Form */}
      {showAdd && (
        <div className="card p-5 border border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text">New Department</h2>
            <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-bg text-text-muted"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Department Name *</label>
              <input className="input w-full text-sm" placeholder="e.g. B.Tech CSE" value={newDept.name} onChange={e => setNewDept(v => ({...v, name: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Code *</label>
              <input className="input w-full text-sm" placeholder="e.g. CSE" value={newDept.code} onChange={e => setNewDept(v => ({...v, code: e.target.value}))} maxLength={6} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Subjects (comma-separated)</label>
              <input className="input w-full text-sm" placeholder="CS-101, CS-201" value={newDept.subjects} onChange={e => setNewDept(v => ({...v, subjects: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={!newDept.name || !newDept.code}>Create Department</Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="search" placeholder="Search departments…" className="input pl-9 w-full" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Department Cards */}
      <div className="space-y-3">
        {filtered.map(dept => {
          const tab = deptTab[dept.id] || 'subjects';
          const deptStudents = students[dept.id] || [];
          const isOpen = expanded === dept.id;

          return (
            <div key={dept.id} className="card p-0 overflow-hidden">
              {/* Card Header */}
              <div
                className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-bg transition-colors"
                onClick={() => setExpanded(isOpen ? null : dept.id)}
              >
                <div className="w-10 h-10 rounded bg-primary-soft flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text text-sm">{dept.name}</p>
                    <span className="text-[10px] font-mono bg-bg border border-border text-text-muted px-1.5 py-0.5 rounded">{dept.code}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">HOD: {dept.hod_name ?? <span className="italic">Not assigned</span>}</p>
                </div>
                <StatusBadge variant={dept.status === 'active' ? 'success' : 'neutral'} label={dept.status} />
                {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
                {[
                  { icon: Users,          label: 'Students', val: dept.student_count },
                  { icon: UserCheck,      label: 'Faculty',  val: dept.faculty_count },
                  { icon: BookOpen,       label: 'Subjects', val: dept.subjects.length },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex flex-col items-center py-3">
                    <Icon className="w-4 h-4 text-text-muted mb-1" />
                    <p className="text-sm font-semibold text-text">{val}</p>
                    <p className="text-[10px] text-text-muted">{label}</p>
                  </div>
                ))}
              </div>

              {/* Expanded Tabs */}
              {isOpen && (
                <div className="border-t border-border bg-bg">
                  {/* HOD assign */}
                  <div className="px-4 pt-3 pb-2 border-b border-border flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-text-muted">HOD: </span>
                      <span className="text-xs font-semibold text-text">{dept.hod_name ?? 'Not assigned'}</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setShowAssignHod(dept.id); setAssignHodUid(''); }}
                      className="text-xs text-primary flex items-center gap-1 hover:underline">
                      <Edit className="w-3 h-3" /> {dept.hod_name ? 'Change HOD' : 'Assign HOD'}
                    </button>
                  </div>

                  {showAssignHod === dept.id && (
                    <div className="px-4 py-3 bg-surface border-b border-border flex flex-wrap items-end gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-text-muted mb-1">Select HOD</label>
                        <select className="input w-full text-sm" value={assignHodUid} onChange={e => setAssignHodUid(e.target.value)}>
                          <option value="">Choose user…</option>
                          {hodUsers.map(u => <option key={u.uid} value={u.uid}>{u.name} ({u.email})</option>)}
                        </select>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => assignHod(dept.id)} disabled={!assignHodUid}>Assign</Button>
                      <Button variant="secondary" size="sm" onClick={() => setShowAssignHod(null)}>Cancel</Button>
                    </div>
                  )}

                  {/* Sub-tabs */}
                  <div className="flex gap-1 px-4 pt-3">
                    {(['subjects','students','faculty'] as DeptTab[]).map(t => (
                      <button key={t} onClick={() => setDeptTab(prev => ({...prev, [dept.id]: t}))}
                        className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                          tab === t ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-border'
                        }`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="px-4 py-3">
                    {/* SUBJECTS TAB */}
                    {tab === 'subjects' && (
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-2">Subjects ({dept.subjects.length})</p>
                        {dept.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {dept.subjects.map(s => (
                              <span key={s} className="text-xs font-mono bg-surface border border-border text-text px-2 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-text-muted italic">No subjects assigned yet.</p>
                        )}
                      </div>
                    )}

                    {/* STUDENTS TAB */}
                    {tab === 'students' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-text-muted">Students ({deptStudents.length})</p>
                          <button onClick={() => { setShowAddStudent(dept.id); setNewStudent({name:'',email:'',roll_no:'',year:1}); }}
                            className="text-xs text-primary flex items-center gap-1 hover:underline">
                            <Plus className="w-3 h-3" /> Add Student
                          </button>
                        </div>

                        {showAddStudent === dept.id && (
                          <div className="p-3 rounded bg-surface border border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <input className="input text-xs col-span-2 sm:col-span-1" placeholder="Full name *" value={newStudent.name} onChange={e => setNewStudent(v => ({...v, name: e.target.value}))} />
                            <input className="input text-xs col-span-2 sm:col-span-1" placeholder="Email *" value={newStudent.email} onChange={e => setNewStudent(v => ({...v, email: e.target.value}))} />
                            <input className="input text-xs" placeholder={`Roll (auto: ${genRoll(dept.code, deptStudents)})`} value={newStudent.roll_no} onChange={e => setNewStudent(v => ({...v, roll_no: e.target.value}))} />
                            <select className="input text-xs" value={newStudent.year} onChange={e => setNewStudent(v => ({...v, year: Number(e.target.value)}))}>
                              {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                            <div className="col-span-2 sm:col-span-4 flex gap-2">
                              <Button variant="primary" size="sm" onClick={() => addStudent(dept.id, dept.code)} disabled={!newStudent.name || !newStudent.email}>Add</Button>
                              <Button variant="secondary" size="sm" onClick={() => setShowAddStudent(null)}>Cancel</Button>
                            </div>
                          </div>
                        )}

                        {deptStudents.length === 0 ? (
                          <p className="text-xs text-text-muted italic">No students added yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 text-text-muted font-medium"><Hash className="w-3 h-3 inline mr-1" />Roll No.</th>
                                  <th className="text-left py-2 text-text-muted font-medium">Name</th>
                                  <th className="text-left py-2 text-text-muted font-medium">Email</th>
                                  <th className="text-left py-2 text-text-muted font-medium">Year</th>
                                  <th className="text-left py-2 text-text-muted font-medium">Status</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {deptStudents.map(s => (
                                  <tr key={s.uid} className="border-b border-border hover:bg-bg">
                                    <td className="py-2 font-mono font-semibold text-text">{s.roll_no}</td>
                                    <td className="py-2 font-medium text-text">{s.name}</td>
                                    <td className="py-2 text-text-muted">{s.email}</td>
                                    <td className="py-2 text-text-muted">Year {s.year}</td>
                                    <td className="py-2"><StatusBadge variant={s.status === 'active' ? 'success' : 'neutral'} label={s.status} /></td>
                                    <td className="py-2">
                                      <button onClick={() => removeStudent(dept.id, s.uid)} className="p-1 hover:bg-danger-soft text-danger rounded">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* FACULTY TAB */}
                    {tab === 'faculty' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-text-muted">Faculties ({(dept.faculties || []).length})</p>
                          <button onClick={() => { setShowAssignFaculty(dept.id); setAssignFacultyUid(''); setAssignSubject(''); }}
                            className="text-xs text-primary flex items-center gap-1 hover:underline">
                            <Plus className="w-3 h-3" /> Assign Faculty
                          </button>
                        </div>

                        {showAssignFaculty === dept.id && (
                          <div className="p-3 rounded bg-surface border border-border flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[180px]">
                              <label className="block text-xs text-text-muted mb-1">Faculty User</label>
                              <select className="input w-full text-xs" value={assignFacultyUid} onChange={e => setAssignFacultyUid(e.target.value)}>
                                <option value="">Choose faculty…</option>
                                {facultyUsers.map(u => <option key={u.uid} value={u.uid}>{u.name}</option>)}
                              </select>
                            </div>
                            <div className="flex-1 min-w-[140px]">
                              <label className="block text-xs text-text-muted mb-1">Assign Subject</label>
                              <select className="input w-full text-xs" value={assignSubject} onChange={e => setAssignSubject(e.target.value)}>
                                <option value="">Choose subject…</option>
                                {dept.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <Button variant="primary" size="sm" onClick={() => assignFaculty(dept.id)} disabled={!assignFacultyUid}>Assign</Button>
                            <Button variant="secondary" size="sm" onClick={() => setShowAssignFaculty(null)}>Cancel</Button>
                          </div>
                        )}

                        {(dept.faculties || []).length === 0 ? (
                          <p className="text-xs text-text-muted italic">No faculties assigned yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {(dept.faculties || []).map(f => (
                              <div key={f.uid} className="flex items-center justify-between p-2 rounded bg-surface border border-border">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center text-white text-[10px] font-semibold">
                                    {f.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-text">{f.name}</p>
                                    <p className="text-[10px] text-text-muted">{f.subject ? `Subject: ${f.subject}` : f.email}</p>
                                  </div>
                                </div>
                                <button onClick={() => removeFaculty(dept.id, f.uid)} className="p-1 hover:bg-danger-soft text-danger rounded">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-text-muted text-sm">No departments match your search.</div>
      )}
    </div>
  );
}
