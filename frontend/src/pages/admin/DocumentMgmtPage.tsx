import { useState, useMemo } from 'react';
import { FileText, Upload, Search, Lock, Archive, X, ChevronDown, AlertCircle } from 'lucide-react';
import { ClassificationBadge, StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_DOCUMENTS, MOCK_DEPARTMENTS, saveDocuments } from '../../mocks/data';
import { useAuth } from '../../context/AuthContext';
import { formatRelative, formatBytes } from '../../utils/format';
import type { Document, Classification, DocumentCategory } from '../../types/document';

const CLASSIFICATIONS: Classification[] = ['public', 'internal', 'restricted', 'confidential'];
const CATEGORIES: DocumentCategory[] = ['exam_paper', 'circular', 'syllabus', 'financial', 'research', 'general'];
const DEPTS = MOCK_DEPARTMENTS.map(d => d.code);

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUpload, fixedDept }: { onClose: () => void; onUpload: (doc: Document) => void; fixedDept?: string }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [dept, setDept] = useState(fixedDept ?? '');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('general');
  const [classification, setClassification] = useState<Classification>('internal');
  const [file, setFile] = useState<File | null>(null);
  const [accessNote, setAccessNote] = useState('');
  const [error, setError] = useState('');

  // Which subjects does the selected dept have?
  const deptObj = MOCK_DEPARTMENTS.find(d => d.code === dept);

  function validate() {
    if (!title.trim()) return 'Title is required.';
    if (!dept) return 'Department is required.';
    if (!file) return 'Please select a file to upload.';
    return '';
  }

  function handleUpload() {
    const err = validate();
    if (err) { setError(err); return; }

    const doc: Document = {
      document_id: `DOC_${dept}_${Date.now()}`,
      title: title.trim(),
      department: dept,
      subject_id: subject || undefined,
      category,
      classification,
      uploaded_by: user?.uid ?? 'usr_admin_001',
      uploader_name: user?.name ?? 'Admin',
      emergency_locked: false,
      status: 'active',
      created_at: new Date().toISOString(),
      file_size: file!.size,
      file_type: file!.name.split('.').pop() ?? 'bin',
    };
    onUpload(doc);
    onClose();
  }

  const classColor: Record<Classification, string> = {
    public: 'border-success/40 bg-success-soft text-success',
    internal: 'border-info/40 bg-info-soft text-info',
    restricted: 'border-warning/40 bg-warning-soft text-warning-dark',
    confidential: 'border-danger/40 bg-danger-soft text-danger-dark',
  };

  const classDesc: Record<Classification, string> = {
    public: 'Visible to everyone. No restrictions.',
    internal: 'Staff and faculty only. Students cannot access.',
    restricted: 'HOD + Admin + specific tagged users only.',
    confidential: 'Strictly restricted. Subject-owner faculty + Admin only.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/40" onClick={onClose} />
      <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Upload Document</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg text-text-muted"><X className="w-4 h-4" /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-danger-soft rounded text-sm text-danger">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* File picker */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">File *</label>
          <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer hover:bg-bg transition-colors ${file ? 'border-primary bg-primary-soft' : 'border-border'}`}>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" onChange={e => { setFile(e.target.files?.[0] ?? null); setError(''); }} />
            {file ? (
              <div className="text-center">
                <FileText className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium text-primary">{file.name}</p>
                <p className="text-xs text-text-muted">{formatBytes(file.size)}</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-6 h-6 text-text-muted mx-auto mb-1" />
                <p className="text-sm text-text-muted">Click to browse or drag & drop</p>
                <p className="text-xs text-text-muted">PDF, DOC, PPT, XLS, TXT</p>
              </div>
            )}
          </label>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Document Title *</label>
          <input className="input w-full text-sm" placeholder="e.g. CS-301 Mid-Term Paper 2025" value={title} onChange={e => { setTitle(e.target.value); setError(''); }} />
        </div>

        {/* Dept + Subject */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Department *</label>
            <div className="relative">
              <select className="input w-full text-sm appearance-none pr-7" value={dept} onChange={e => { setDept(e.target.value); setSubject(''); }} disabled={!!fixedDept}>
                {!fixedDept && <option value="">Select dept…</option>}
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Subject (optional)</label>
            <div className="relative">
              <select className="input w-full text-sm appearance-none pr-7" value={subject} onChange={e => setSubject(e.target.value)} disabled={!deptObj || deptObj.subjects.length === 0}>
                <option value="">None</option>
                {deptObj?.subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category + Classification */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Category</label>
            <div className="relative">
              <select className="input w-full text-sm appearance-none pr-7" value={category} onChange={e => setCategory(e.target.value as DocumentCategory)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Classification *</label>
            <div className="relative">
              <select className="input w-full text-sm appearance-none pr-7" value={classification} onChange={e => setClassification(e.target.value as Classification)}>
                {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Classification explanation */}
        <div className={`p-3 rounded border text-xs ${classColor[classification]}`}>
          <p className="font-semibold capitalize mb-0.5">{classification}</p>
          <p className="text-text">{classDesc[classification]}</p>
        </div>

        {/* Access note */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Access Note (optional)</label>
          <textarea
            className="input w-full text-sm resize-none h-16"
            placeholder="e.g. Only share with CS-301 faculty before exam date…"
            value={accessNote}
            onChange={e => setAccessNote(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" className="flex-1" onClick={handleUpload}>
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentMgmtPage() {
  const { user } = useAuth();
  const isHod = user?.role === 'dept_admin';
  const isFaculty = user?.role === 'faculty';
  const scopedDept = (isHod || isFaculty) ? user?.department : undefined;

  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const filtered = useMemo(() => {
    return documents.filter(d => {
      if (scopedDept && d.department !== scopedDept) return false;
      if (isFaculty && user?.assigned_subjects?.length && d.subject_id && !user.assigned_subjects.includes(d.subject_id) && d.uploaded_by !== user.uid) return false;
      const q = search.toLowerCase();
      const matchSearch = !search || d.title.toLowerCase().includes(q) || d.department.toLowerCase().includes(q) || (d.subject_id ?? '').toLowerCase().includes(q) || (d.uploader_name ?? '').toLowerCase().includes(q);
      const matchDept = !filterDept || d.department === filterDept;
      const matchClass = !filterClass || d.classification === filterClass;
      return matchSearch && matchDept && matchClass;
    });
  }, [documents, search, filterDept, filterClass, scopedDept, isFaculty, user?.assigned_subjects, user?.uid]);

  function toggleLock(id: string) {
    const idx = MOCK_DOCUMENTS.findIndex(d => d.document_id === id);
    if (idx > -1) {
      MOCK_DOCUMENTS[idx] = { ...MOCK_DOCUMENTS[idx], emergency_locked: !MOCK_DOCUMENTS[idx].emergency_locked };
      saveDocuments();
    }
    setDocuments([...MOCK_DOCUMENTS]);
  }

  function archive(id: string) {
    const idx = MOCK_DOCUMENTS.findIndex(d => d.document_id === id);
    if (idx > -1) {
      MOCK_DOCUMENTS[idx] = { ...MOCK_DOCUMENTS[idx], status: MOCK_DOCUMENTS[idx].status === 'archived' ? 'active' : 'archived' };
      saveDocuments();
    }
    setDocuments([...MOCK_DOCUMENTS]);
  }

  function handleUpload(doc: Document) {
    MOCK_DOCUMENTS.unshift(doc);
    saveDocuments();
    setDocuments([...MOCK_DOCUMENTS]);
  }

  return (
    <div className="space-y-5">
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={handleUpload} fixedDept={scopedDept} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Document Management</h1>
          <p className="text-sm text-text-muted mt-1">Upload, classify and manage institutional documents. {documents.length} documents total.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>
          <Upload className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="card px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            placeholder="Search by title, dept, subject or uploader…"
            className="input pl-9 w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input text-sm" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="input text-sm" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classifications</option>
          {CLASSIFICATIONS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['public', 'internal', 'restricted', 'confidential'] as Classification[]).map(c => {
          const count = documents.filter(d => d.classification === c).length;
          return (
            <div key={c} className="card p-3 text-center">
              <p className="text-lg font-semibold text-text">{count}</p>
              <ClassificationBadge classification={c} />
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden overflow-x-auto p-0">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-bg border-b border-border">
            <tr>
              {['Name', 'Dept', 'Subject', 'Category', 'Classification', 'Owner', 'Size', 'Updated', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-10 text-text-muted text-sm">No documents match your filters.</td></tr>
            ) : filtered.map(doc => (
              <tr key={doc.document_id} className={`border-b border-border hover:bg-bg ${doc.status === 'archived' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                    <span className="font-medium text-text max-w-[200px] truncate">{doc.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">{doc.department}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{doc.subject_id ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-text-muted capitalize">{doc.category.replace('_', ' ')}</td>
                <td className="px-4 py-3"><ClassificationBadge classification={doc.classification} /></td>
                <td className="px-4 py-3 text-xs text-text-muted">{doc.uploader_name}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{doc.file_size ? formatBytes(doc.file_size) : '—'}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{formatRelative(doc.created_at)}</td>
                <td className="px-4 py-3">
                  {doc.emergency_locked
                    ? <StatusBadge variant="danger" label="Locked" />
                    : doc.status === 'archived'
                      ? <StatusBadge variant="neutral" label="Archived" />
                      : <StatusBadge variant="success" label="Active" />
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      className={`p-1.5 rounded hover:bg-bg text-text-muted ${doc.emergency_locked ? 'text-danger' : ''}`}
                      title={doc.emergency_locked ? 'Unlock' : 'Lock'}
                      onClick={() => toggleLock(doc.document_id)}
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded hover:bg-bg text-text-muted"
                      title={doc.status === 'archived' ? 'Restore' : 'Archive'}
                      onClick={() => archive(doc.document_id)}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-muted">{filtered.length} of {documents.length} documents shown</p>
    </div>
  );
}
