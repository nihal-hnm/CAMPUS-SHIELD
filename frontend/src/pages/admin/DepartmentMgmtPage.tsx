import { useState } from 'react';
import { Building2, Users, BookOpen, Search, Plus, Edit2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MOCK_DEPARTMENTS, type Department } from '../../mocks/data';

export default function DepartmentMgmtPage() {
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS.filter(d => d.code !== 'ALL'));
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '', subjects: '' });

  const filtered = departments.filter(d =>
    !search ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd() {
    if (!newDept.name || !newDept.code) return;
    const dept: Department = {
      id: `dept_${newDept.code.toLowerCase()}`,
      name: newDept.name,
      code: newDept.code.toUpperCase(),
      hod_id: undefined,
      hod_name: undefined,
      subjects: newDept.subjects.split(',').map(s => s.trim()).filter(Boolean),
      student_count: 0,
      faculty_count: 0,
      status: 'active',
    };
    setDepartments(prev => [...prev, dept]);
    setNewDept({ name: '', code: '', subjects: '' });
    setShowAdd(false);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Department Management</h1>
          <p className="text-sm text-text-muted mt-1">Manage departments, their HODs and assigned subjects. {departments.length} departments registered.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(v => !v)}>
          <Plus className="w-4 h-4" /> Add Department
        </Button>
      </div>

      {/* Add Department form */}
      {showAdd && (
        <div className="card p-5 border-primary/30 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text">New Department</h2>
            <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-bg text-text-muted"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Department Name *</label>
              <input className="input w-full text-sm" placeholder="e.g. B.Tech CSE" value={newDept.name} onChange={e => setNewDept(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Code *</label>
              <input className="input w-full text-sm" placeholder="e.g. CSE" value={newDept.code} onChange={e => setNewDept(v => ({ ...v, code: e.target.value }))} maxLength={6} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Subject Codes (comma-separated)</label>
              <input className="input w-full text-sm" placeholder="e.g. CS-101, CS-201" value={newDept.subjects} onChange={e => setNewDept(v => ({ ...v, subjects: e.target.value }))} />
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
          <input
            type="search"
            placeholder="Search departments…"
            className="input pl-9 w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(dept => (
          <div key={dept.id} className="card p-0 overflow-hidden">
            {/* Card Header */}
            <div
              className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-bg transition-colors"
              onClick={() => setExpanded(expanded === dept.id ? null : dept.id)}
            >
              <div className="w-10 h-10 rounded bg-primary-soft flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-text text-sm">{dept.name}</p>
                  <span className="text-[10px] font-mono bg-bg border border-border text-text-muted px-1.5 py-0.5 rounded">{dept.code}</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">HOD: {dept.hod_name ?? 'Not assigned'}</p>
              </div>
              <StatusBadge variant={dept.status === 'active' ? 'success' : 'neutral'} label={dept.status} />
              {expanded === dept.id ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              <div className="flex flex-col items-center py-3">
                <Users className="w-4 h-4 text-text-muted mb-1" />
                <p className="text-sm font-semibold text-text">{dept.student_count}</p>
                <p className="text-[10px] text-text-muted">Students</p>
              </div>
              <div className="flex flex-col items-center py-3">
                <Users className="w-4 h-4 text-text-muted mb-1" />
                <p className="text-sm font-semibold text-text">{dept.faculty_count}</p>
                <p className="text-[10px] text-text-muted">Faculty</p>
              </div>
              <div className="flex flex-col items-center py-3">
                <BookOpen className="w-4 h-4 text-text-muted mb-1" />
                <p className="text-sm font-semibold text-text">{dept.subjects.length}</p>
                <p className="text-[10px] text-text-muted">Subjects</p>
              </div>
            </div>

            {/* Expanded Subject List */}
            {expanded === dept.id && (
              <div className="border-t border-border px-4 py-3 bg-bg">
                <p className="text-xs font-medium text-text-muted mb-2">Subjects</p>
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
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-text-muted text-sm">
          No departments match your search.
        </div>
      )}
    </div>
  );
}
