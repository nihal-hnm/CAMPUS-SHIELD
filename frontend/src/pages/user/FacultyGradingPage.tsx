import { useState, useMemo } from 'react';
import {
  Award, FileText, Search, CheckCircle, Clock, X, Download,
  Plus, ClipboardList, Trash2, Calendar, ChevronDown
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  MOCK_ASSIGNMENTS, MOCK_ASSIGNMENT_TASKS, MOCK_DEPARTMENTS,
  saveAssignments, saveAssignmentTasks,
  type AssignmentSubmission, type AssignedTask
} from '../../mocks/data';
import { formatBytes, formatRelative } from '../../utils/format';

const GRADE_PRESETS = ['A+', 'A', 'A-', 'B+', 'B', 'C+', 'C', 'D', 'F'];

export default function FacultyGradingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'tasks' | 'submissions'>('tasks');
  const [tasks, setTasks] = useState<AssignedTask[]>(MOCK_ASSIGNMENT_TASKS);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(MOCK_ASSIGNMENTS);

  // Assign new task state
  const [showCreate, setShowCreate] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskProblem, setTaskProblem] = useState('');
  const [taskError, setTaskError] = useState('');

  // Submissions filter & grade modal
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

  const scopedTasks = useMemo(() => {
    return tasks.filter(t => {
      if (user?.department && user.department !== 'ALL' && t.department !== user.department) return false;
      if (!isHod && assignedSubjects.length > 0 && !assignedSubjects.includes(t.subject)) return false;
      return true;
    });
  }, [tasks, user?.department, isHod, assignedSubjects]);

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

  function handleCreateTask() {
    setTaskError('');
    if (!taskTitle.trim()) { setTaskError('Assignment title is required.'); return; }
    if (!taskSubject) { setTaskError('Please select a subject.'); return; }
    if (!taskProblem.trim()) { setTaskError('Problem statement is required.'); return; }

    const newTask: AssignedTask = {
      id: `TASK_${Date.now()}`,
      title: taskTitle.trim(),
      problem_statement: taskProblem.trim(),
      subject: taskSubject,
      department: user?.department ?? 'GEN',
      due_date: taskDue || undefined,
      assigned_by: user!.uid,
      assigned_by_name: user!.name,
      created_at: new Date().toISOString(),
    };

    MOCK_ASSIGNMENT_TASKS.unshift(newTask);
    saveAssignmentTasks();
    setTasks([...MOCK_ASSIGNMENT_TASKS]);
    setTaskTitle('');
    setTaskSubject('');
    setTaskDue('');
    setTaskProblem('');
    setShowCreate(false);
  }

  function deleteTask(id: string) {
    const idx = MOCK_ASSIGNMENT_TASKS.findIndex(t => t.id === id);
    if (idx > -1) {
      MOCK_ASSIGNMENT_TASKS.splice(idx, 1);
      saveAssignmentTasks();
    }
    setTasks([...MOCK_ASSIGNMENT_TASKS]);
  }

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

  function handleAccessSubmission(item: AssignmentSubmission) {
    // If the student's actual uploaded file data URL was stored, download it directly
    if (item.file_data_url) {
      const a = document.createElement('a');
      a.href = item.file_data_url;
      a.download = item.file_name;
      a.click();
      return;
    }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Assignments & Grading</h1>
          <p className="text-sm text-text-muted mt-1">
            Assign problem statements to students, access submitted files, and grade according to your subject
            {!isHod && assignedSubjects.length > 0
              ? ` (${assignedSubjects.join(', ')}).`
              : ` (${user?.department ?? 'Department'}).`}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setTab('tasks');
            setShowCreate(v => !v);
            setTaskError('');
            if (!taskSubject && availableSubjects.length === 1) setTaskSubject(availableSubjects[0]);
          }}
        >
          <Plus className="w-4 h-4" /> Assign Assignment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xl font-bold text-text">{scopedTasks.length}</p>
            <p className="text-xs text-text-muted">Assigned Tasks</p>
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
            <p className="text-xs text-text-muted">Graded Submissions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg rounded-lg w-fit border border-border">
        <button
          onClick={() => setTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'tasks' ? 'bg-surface shadow text-text' : 'text-text-muted hover:text-text'
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Assigned Problem Statements
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tab === 'tasks' ? 'bg-primary text-white' : 'bg-border text-text-muted'}`}>
            {scopedTasks.length}
          </span>
        </button>
        <button
          onClick={() => setTab('submissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'submissions' ? 'bg-surface shadow text-text' : 'text-text-muted hover:text-text'
          }`}
        >
          <FileText className="w-4 h-4" /> Student Submissions & Grades
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tab === 'submissions' ? 'bg-primary text-white' : 'bg-border text-text-muted'}`}>
            {scoped.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ASSIGNED TASKS */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          {showCreate && (
            <div className="card p-5 border border-primary/30 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text">Assign New Assignment</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-bg text-text-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {taskError && <div className="p-2.5 rounded bg-danger-soft text-danger text-sm">{taskError}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Assignment Title *</label>
                  <input
                    className="input w-full text-sm"
                    placeholder="e.g. Lab 3: Binary Search Trees"
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Subject *</label>
                  <div className="relative">
                    <select
                      className="input w-full text-sm appearance-none pr-8"
                      value={taskSubject}
                      onChange={e => setTaskSubject(e.target.value)}
                    >
                      <option value="">Select subject…</option>
                      {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Due Date (optional)</label>
                  <input
                    type="date"
                    className="input w-full text-sm"
                    value={taskDue}
                    onChange={e => setTaskDue(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Problem Statement *</label>
                <textarea
                  className="input w-full text-sm resize-y"
                  rows={4}
                  placeholder="Describe the problem statement, requirements, and submission instructions for students…"
                  value={taskProblem}
                  onChange={e => setTaskProblem(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleCreateTask}>Publish Assignment</Button>
              </div>
            </div>
          )}

          {scopedTasks.length === 0 ? (
            <div className="card p-10 text-center text-text-muted text-sm">
              No assignments published yet. Click "Assign Assignment" to create a problem statement for students.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scopedTasks.map(t => {
                const subCount = scoped.filter(s => s.task_id === t.id).length;
                return (
                  <div key={t.id} className="card p-5 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-text text-sm">{t.title}</h3>
                          <p className="text-xs text-text-muted mt-0.5">
                            Assigned {formatRelative(t.created_at)}
                            {t.due_date ? ` · Due ${new Date(t.due_date).toLocaleDateString()}` : ''}
                          </p>
                        </div>
                        <span className="text-xs font-mono bg-primary-soft text-primary px-2 py-0.5 rounded font-medium">
                          {t.subject}
                        </span>
                      </div>

                      <div className="p-3 rounded bg-bg border border-border">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">Problem Statement</p>
                        <p className="text-xs text-text whitespace-pre-line leading-relaxed">{t.problem_statement}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <button
                        onClick={() => { setFilterSubject(t.subject); setTab('submissions'); }}
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5" /> {subCount} submission{subCount !== 1 ? 's' : ''} — View & Grade
                      </button>
                      <button
                        onClick={() => deleteTask(t.id)}
                        className="p-1.5 rounded hover:bg-danger-soft text-danger"
                        title="Delete assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBMISSIONS & GRADING */}
      {tab === 'submissions' && (
        <>
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
                          onClick={() => handleAccessSubmission(s)}
                          className="p-1.5 rounded hover:bg-bg text-text-muted"
                          title="Access / Download uploaded assignment"
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
        </>
      )}

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
    </div>
  );
}
