import { useState, useMemo } from 'react';
import { Award, FileText, Search, CheckCircle, Clock, X, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { MOCK_ASSIGNMENTS, MOCK_DEPARTMENTS, saveAssignments, type AssignmentSubmission } from '../../mocks/data';
import { formatBytes, formatRelative } from '../../utils/format';

const GRADE_PRESETS = ['A+', 'A', 'A-', 'B+', 'B', 'C+', 'C', 'D', 'F'];

export default function FacultyGradingPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(MOCK_ASSIGNMENTS);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'graded'>('all');
  const [gradingItem, setGradingItem] = useState<AssignmentSubmission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const isHod = user?.role === 'dept_admin';
  const assignedSubjects = user?.assigned_subjects ?? [];
  const deptObj = MOCK_DEPARTMENTS.find(d => d.code === user?.department);
  const availableSubjects = !isHod && assignedSubjects.length > 0
    ? assignedSubjects
    : (deptObj?.subjects ?? []);

  const scoped = useMemo(() => {
    return submissions.filter(s => {
      if (user?.department && user.department !== 'ALL' && s.department !== user.department) return false;
      if (!isHod && assignedSubjects.length > 0 && !assignedSubjects.includes(s.subject)) return false;
      return true;
    });
  }, [submissions, user?.department, isHod, assignedSubjects]);

  const filtered = useMemo(() => {
    return scoped.filter(s => {
      const q = search.toLowerCase();
      const matchQ = !q ||
        s.title.toLowerCase().includes(q) ||
        s.student_name.toLowerCase().includes(q) ||
        (s.student_roll ?? '').toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q);
      const matchSubj = !filterSubject || s.subject === filterSubject;
      const matchStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchQ && matchSubj && matchStatus;
    });
  }, [scoped, search, filterSubject, filterStatus]);

  function openGradeModal(item: AssignmentSubmission) {
    setGradingItem(item);
    setGrade(item.grade ?? '');
    setFeedback(item.feedback ?? '');
  }

  function handleSaveGrade() {
    if (!gradingItem || !grade.trim()) return;
    const idx = MOCK_ASSIGNMENTS.findIndex(a => a.id === gradingItem.id);
    if (idx > -1) {
      MOCK_ASSIGNMENTS[idx] = {
        ...MOCK_ASSIGNMENTS[idx],
        grade: grade.trim(),
        feedback: feedback.trim() || undefined,
        graded_by: user?.uid,
        graded_by_name: user?.name,
        graded_at: new Date().toISOString(),
        status: 'graded',
      };
      saveAssignments();
    }
    setSubmissions([...MOCK_ASSIGNMENTS]);
    setGradingItem(null);
  }

  function handleDownloadPreview(item: AssignmentSubmission) {
    const content = [
      `Assignment: ${item.title}`,
      `Subject: ${item.subject} (${item.department})`,
      `Student: ${item.student_name}${item.student_roll ? ` (${item.student_roll})` : ''}`,
      `Original File: ${item.file_name} (${formatBytes(item.file_size)})`,
      `Submitted At: ${new Date(item.submitted_at).toLocaleString()}`,
      item.notes ? `Student Notes: ${item.notes}` : '',
      item.grade ? `Grade: ${item.grade}` : 'Grade: Pending',
      item.feedback ? `Feedback: ${item.feedback}` : '',
    ].filter(Boolean).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.student_name.replace(/\s+/g, '_')}_${item.subject}_${item.file_name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-text">Student Submissions & Grading</h1>
        <p className="text-sm text-text-muted mt-1">
          Review uploaded student assignments and assign grades
          {!isHod && assignedSubjects.length > 0
            ? ` for your assigned subjects (${assignedSubjects.join(', ')}).`
            : ` for ${user?.department ?? 'your department'}.`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xl font-bold text-text">{scoped.length}</p>
            <p className="text-xs text-text-muted">Total Submissions</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-warning" />
          <div>
            <p className="text-xl font-bold text-text">{scoped.filter(s => s.status === 'submitted').length}</p>
            <p className="text-xs text-text-muted">Pending Grading</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-success" />
          <div>
            <p className="text-xl font-bold text-text">{scoped.filter(s => s.status === 'graded').length}</p>
            <p className="text-xs text-text-muted">Graded</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            placeholder="Search by student, roll no., title or subject…"
            className="input pl-9 w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto text-sm" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input w-auto text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
          <option value="all">All Statuses</option>
          <option value="submitted">Pending Grading</option>
          <option value="graded">Graded</option>
        </select>
      </div>

      {/* Grade Modal */}
      {gradingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Assign Grade
              </h2>
              <button onClick={() => setGradingItem(null)} className="p-1 rounded hover:bg-bg text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded bg-bg border border-border text-xs space-y-1">
              <p className="font-semibold text-text">{gradingItem.title}</p>
              <p className="text-text-muted">
                Student: <span className="text-text font-medium">{gradingItem.student_name}</span>
                {gradingItem.student_roll ? ` (${gradingItem.student_roll})` : ''}
              </p>
              <p className="text-text-muted">Subject: <span className="font-mono text-text">{gradingItem.subject}</span></p>
              <p className="text-text-muted">File: {gradingItem.file_name} ({formatBytes(gradingItem.file_size)})</p>
              {gradingItem.notes && <p className="text-text-muted italic">"{gradingItem.notes}"</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Grade / Score *</label>
              <input
                className="input w-full text-sm mb-2"
                placeholder="e.g. A+ or 92/100"
                value={grade}
                onChange={e => setGrade(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5">
                {GRADE_PRESETS.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`px-2.5 py-1 text-xs rounded border font-medium transition-colors ${
                      grade === g ? 'bg-primary text-white border-primary' : 'bg-bg border-border text-text hover:border-primary'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Faculty Feedback (optional)</label>
              <textarea
                className="input w-full text-sm resize-none"
                rows={3}
                placeholder="Write constructive feedback for the student…"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setGradingItem(null)}>Cancel</Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={handleSaveGrade} disabled={!grade.trim()}>
                Save Grade
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[750px]">
          <thead className="bg-bg border-b border-border">
            <tr>
              {['Student', 'Roll No.', 'Subject', 'Assignment & File', 'Submitted', 'Status', 'Grade', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-text-muted text-sm">
                  No student submissions found for your subject(s) yet.
                </td>
              </tr>
            )}
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-border hover:bg-bg">
                <td className="px-4 py-3 font-medium text-text">{s.student_name}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{s.student_roll || '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono bg-bg border border-border px-2 py-0.5 rounded">{s.subject}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{s.title}</p>
                  <p className="text-[11px] text-text-muted">{s.file_name} · {formatBytes(s.file_size)}</p>
                </td>
                <td className="px-4 py-3 text-xs text-text-muted">{formatRelative(s.submitted_at)}</td>
                <td className="px-4 py-3">
                  <StatusBadge variant={s.status === 'graded' ? 'success' : 'warning'} label={s.status} />
                </td>
                <td className="px-4 py-3">
                  {s.grade ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold text-xs">{s.grade}</span>
                  ) : (
                    <span className="text-xs text-text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownloadPreview(s)}
                      className="p-1.5 rounded hover:bg-bg text-text-muted"
                      title="Access / Download submission"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <Button variant="primary" size="sm" onClick={() => openGradeModal(s)}>
                      <Award className="w-3.5 h-3.5" /> {s.grade ? 'Edit Grade' : 'Grade'}
                    </Button>
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
