import { useState, useMemo } from 'react';
import { Upload, FileText, CheckCircle, Clock, Award, Plus, X, ChevronDown, ClipboardList, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  MOCK_ASSIGNMENTS, MOCK_ASSIGNMENT_TASKS, MOCK_DEPARTMENTS,
  saveAssignments, type AssignmentSubmission, type AssignedTask
} from '../../mocks/data';
import { formatBytes, formatRelative } from '../../utils/format';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(MOCK_ASSIGNMENTS);
  const [tasks] = useState<AssignedTask[]>(MOCK_ASSIGNMENT_TASKS);

  const [showUpload, setShowUpload] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AssignedTask | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const deptObj = MOCK_DEPARTMENTS.find(d => d.code === user?.department);
  const subjects = deptObj?.subjects ?? [];

  const deptTasks = useMemo(
    () => tasks.filter(t => !user?.department || user.department === 'ALL' || t.department === user.department),
    [tasks, user?.department]
  );

  const mySubmissions = useMemo(
    () => submissions.filter(s => s.student_uid === user?.uid),
    [submissions, user?.uid]
  );

  function openUploadForTask(task?: AssignedTask) {
    setError('');
    if (task) {
      setSelectedTask(task);
      setTitle(task.title);
      setSubject(task.subject);
    } else {
      setSelectedTask(null);
      setTitle('');
      setSubject('');
    }
    setNotes('');
    setFile(null);
    setShowUpload(true);
  }

  function handleSubmit() {
    setError('');
    if (!title.trim()) { setError('Assignment title is required.'); return; }
    if (!subject) { setError('Please select a subject.'); return; }
    if (!file) { setError('Please attach your assignment file.'); return; }

    const finalize = (dataUrl?: string) => {
      const item: AssignmentSubmission = {
        id: `ASN_${Date.now()}`,
        task_id: selectedTask?.id,
        title: title.trim(),
        subject,
        department: user?.department ?? 'GEN',
        student_uid: user!.uid,
        student_name: user!.name,
        student_roll: (user as any).roll_no || undefined,
        file_name: file.name,
        file_size: file.size,
        file_type: file.name.split('.').pop() ?? 'pdf',
        file_data_url: dataUrl,
        notes: notes.trim() || undefined,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      };

      MOCK_ASSIGNMENTS.unshift(item);
      saveAssignments();
      setSubmissions([...MOCK_ASSIGNMENTS]);
      setSelectedTask(null);
      setTitle('');
      setSubject('');
      setNotes('');
      setFile(null);
      setShowUpload(false);
    };

    // Read small files (< 1.5 MB) so faculty can download the actual uploaded file
    if (file.size <= 1.5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => finalize(typeof reader.result === 'string' ? reader.result : undefined);
      reader.onerror = () => finalize(undefined);
      reader.readAsDataURL(file);
    } else {
      finalize(undefined);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Assignments</h1>
          <p className="text-sm text-text-muted mt-1">
            View assigned problem statements from your {user?.department} faculty, upload your work, and check grades.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => openUploadForTask()}>
          <Plus className="w-4 h-4" /> Custom Upload
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xl font-bold text-text">{deptTasks.length}</p>
            <p className="text-xs text-text-muted">Assigned Tasks</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-warning" />
          <div>
            <p className="text-xl font-bold text-text">{mySubmissions.filter(s => s.status === 'submitted').length}</p>
            <p className="text-xs text-text-muted">Awaiting Grade</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <Award className="w-5 h-5 text-success" />
          <div>
            <p className="text-xl font-bold text-text">{mySubmissions.filter(s => s.status === 'graded').length}</p>
            <p className="text-xs text-text-muted">Graded</p>
          </div>
        </div>
      </div>

      {/* Upload Modal / Form */}
      {showUpload && (
        <div className="card p-5 border border-primary/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text">
              {selectedTask ? `Submit: ${selectedTask.title}` : 'Submit Assignment'}
            </h2>
            <button onClick={() => setShowUpload(false)} className="p-1 rounded hover:bg-bg text-text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedTask && (
            <div className="p-3 rounded bg-bg border border-border text-xs space-y-1">
              <p className="font-semibold text-text">Problem Statement ({selectedTask.subject})</p>
              <p className="text-text-muted whitespace-pre-line">{selectedTask.problem_statement}</p>
            </div>
          )}

          {error && <div className="p-2.5 rounded bg-danger-soft text-danger text-sm">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Assignment Title *</label>
              <input
                className="input w-full text-sm"
                placeholder="e.g. Lab 3 - Data Structures Report"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={!!selectedTask}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Subject *</label>
              <div className="relative">
                <select
                  className="input w-full text-sm appearance-none pr-8"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  disabled={!!selectedTask}
                >
                  <option value="">Select subject…</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Upload File *</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-5 cursor-pointer hover:border-primary transition-colors bg-bg">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt"
                onChange={e => { setFile(e.target.files?.[0] ?? null); setError(''); }}
              />
              {file ? (
                <div className="text-center">
                  <FileText className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-sm font-medium text-primary">{file.name}</p>
                  <p className="text-xs text-text-muted">{formatBytes(file.size)}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-6 h-6 text-text-muted mx-auto mb-1" />
                  <p className="text-sm text-text-muted">Click to choose your assignment file</p>
                  <p className="text-xs text-text-muted">PDF, DOC, PPT, ZIP, TXT</p>
                </div>
              )}
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Notes for Faculty (optional)</label>
            <textarea
              className="input w-full text-sm resize-none"
              rows={2}
              placeholder="Any comments or notes…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit}>Submit Assignment</Button>
          </div>
        </div>
      )}

      {/* Assigned by Faculty Section */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-text">Assigned by Faculty</h2>
        {deptTasks.length === 0 ? (
          <div className="card p-8 text-center text-text-muted text-sm">
            No assignments have been posted by your faculty yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deptTasks.map(task => {
              const mySub = mySubmissions.find(s => s.task_id === task.id);
              return (
                <div key={task.id} className="card p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-text text-sm">{task.title}</h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          By {task.assigned_by_name} · {formatRelative(task.created_at)}
                        </p>
                      </div>
                      <span className="text-xs font-mono bg-primary-soft text-primary px-2 py-0.5 rounded font-medium">
                        {task.subject}
                      </span>
                    </div>

                    <div className="p-3 rounded bg-bg border border-border">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">Problem Statement</p>
                      <p className="text-xs text-text whitespace-pre-line leading-relaxed">{task.problem_statement}</p>
                    </div>

                    {task.due_date && (
                      <p className="text-xs text-text-muted flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    {mySub ? (
                      <>
                        <div className="flex items-center gap-2">
                          <StatusBadge variant={mySub.status === 'graded' ? 'success' : 'warning'} label={mySub.status} />
                          {mySub.grade && (
                            <span className="text-xs font-semibold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
                              Grade: {mySub.grade}
                            </span>
                          )}
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => openUploadForTask(task)}>
                          <Upload className="w-3.5 h-3.5" /> Re-upload
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-text-muted">Not submitted yet</span>
                        <Button variant="primary" size="sm" onClick={() => openUploadForTask(task)}>
                          <Upload className="w-3.5 h-3.5" /> Upload Assignment
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submissions Table */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-text">My Submitted Assignments</h2>
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-bg border-b border-border">
              <tr>
                {['Title', 'Subject', 'File', 'Submitted', 'Status', 'Grade', 'Feedback'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mySubmissions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-text-muted text-sm">
                    No assignments submitted yet.
                  </td>
                </tr>
              )}
              {mySubmissions.map(s => (
                <tr key={s.id} className="border-b border-border hover:bg-bg">
                  <td className="px-4 py-3 font-medium text-text">{s.title}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-bg border border-border px-2 py-0.5 rounded">{s.subject}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {s.file_name} ({formatBytes(s.file_size)})
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{formatRelative(s.submitted_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={s.status === 'graded' ? 'success' : 'warning'} label={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    {s.grade ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold text-xs">
                        <CheckCircle className="w-3 h-3" /> {s.grade}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted max-w-[200px] truncate" title={s.feedback}>
                    {s.feedback || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
