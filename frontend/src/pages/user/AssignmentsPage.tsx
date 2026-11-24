import { useState, useMemo } from 'react';
import { Upload, FileText, CheckCircle, Clock, Award, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { MOCK_ASSIGNMENTS, MOCK_DEPARTMENTS, saveAssignments, type AssignmentSubmission } from '../../mocks/data';
import { formatBytes, formatRelative } from '../../utils/format';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(MOCK_ASSIGNMENTS);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const deptObj = MOCK_DEPARTMENTS.find(d => d.code === user?.department);
  const subjects = deptObj?.subjects ?? [];

  const mySubmissions = useMemo(
    () => submissions.filter(s => s.student_uid === user?.uid),
    [submissions, user?.uid]
  );

  function handleSubmit() {
    setError('');
    if (!title.trim()) { setError('Assignment title is required.'); return; }
    if (!subject) { setError('Please select a subject.'); return; }
    if (!file) { setError('Please attach your assignment file.'); return; }

    const item: AssignmentSubmission = {
      id: `ASN_${Date.now()}`,
      title: title.trim(),
      subject,
      department: user?.department ?? 'GEN',
      student_uid: user!.uid,
      student_name: user!.name,
      student_roll: (user as any).roll_no || undefined,
      file_name: file.name,
      file_size: file.size,
      file_type: file.name.split('.').pop() ?? 'pdf',
      notes: notes.trim() || undefined,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
    };

    MOCK_ASSIGNMENTS.unshift(item);
    saveAssignments();
    setSubmissions([...MOCK_ASSIGNMENTS]);
    setTitle('');
    setSubject('');
    setNotes('');
    setFile(null);
    setShowUpload(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">My Assignments</h1>
          <p className="text-sm text-text-muted mt-1">
            Upload assignments for your {user?.department} subjects and track faculty grades.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setShowUpload(v => !v); setError(''); }}>
          <Plus className="w-4 h-4" /> Upload Assignment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xl font-bold text-text">{mySubmissions.length}</p>
            <p className="text-xs text-text-muted">Total Submitted</p>
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

      {/* Upload Form */}
      {showUpload && (
        <div className="card p-5 border border-primary/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text">Submit Assignment</h2>
            <button onClick={() => setShowUpload(false)} className="p-1 rounded hover:bg-bg text-text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && <div className="p-2.5 rounded bg-danger-soft text-danger text-sm">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Assignment Title *</label>
              <input
                className="input w-full text-sm"
                placeholder="e.g. Lab 3 - Data Structures Report"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Subject *</label>
              <div className="relative">
                <select
                  className="input w-full text-sm appearance-none pr-8"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
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

      {/* Submissions Table */}
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
                  No assignments submitted yet. Click "Upload Assignment" to submit your work.
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
  );
}
