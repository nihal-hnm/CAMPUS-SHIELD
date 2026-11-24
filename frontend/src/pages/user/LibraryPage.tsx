import React, { useState, useEffect } from 'react';
import { Search, FileText, Grid, List, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClassificationBadge, StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../../components/feedback/States';
import { listDocuments } from '../../services/apiClient';
import { formatRelative } from '../../utils/format';
import type { Document } from '../../types/document';

function DocumentRow({ doc }: { doc: Document }) {
  return (
    <tr className="border-b border-border hover:bg-bg cursor-pointer transition-colors">
      <td className="px-5 py-3">
        <Link to={`/documents/${doc.document_id}`} className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
          <span className="font-medium text-text hover:text-primary truncate max-w-[260px]">{doc.title}</span>
        </Link>
      </td>
      <td className="px-3 py-3 text-sm text-text-muted">{doc.department}</td>
      <td className="px-3 py-3 text-sm text-text-muted font-mono">{(doc as any).subject_id ?? '—'}</td>
      <td className="px-3 py-3"><ClassificationBadge classification={doc.classification} /></td>
      <td className="px-3 py-3 text-sm text-text-muted">{(doc as any).uploader_name ?? doc.uploaded_by}</td>
      <td className="px-3 py-3 text-xs text-text-muted">{formatRelative((doc as any).created_at ?? new Date().toISOString())}</td>
      <td className="px-5 py-3">
        {(doc as any).emergency_locked
          ? <StatusBadge variant="danger"  label="Locked" />
          : <StatusBadge variant="success" label="Active" />
        }
      </td>
    </tr>
  );
}

function DocumentCard({ doc }: { doc: Document }) {
  return (
    <Link to={`/documents/${doc.document_id}`} className="card p-4 hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded bg-bg flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-text-muted" />
        </div>
        <ClassificationBadge classification={doc.classification} />
      </div>
      <div>
        <p className="font-medium text-text text-sm leading-tight line-clamp-2">{doc.title}</p>
        <p className="text-xs text-text-muted mt-1">{doc.department}</p>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-text-muted">{formatRelative((doc as any).created_at ?? new Date().toISOString())}</span>
        {(doc as any).emergency_locked
          ? <StatusBadge variant="danger"  label="Locked" />
          : <StatusBadge variant="success" label="Active" />
        }
      </div>
    </Link>
  );
}

export default function LibraryPage() {
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err: any) {
      setError(err?.reason ?? err?.message ?? 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, []);

  const filtered = documents.filter(d => {
    const matchSearch =
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.department.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || d.classification === filterClass;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">Document Library</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Showing documents accessible to your role · access checked at open time
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadDocuments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search documents…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="input text-sm"
        >
          <option value="">All classifications</option>
          <option value="public">Public</option>
          <option value="internal">Internal</option>
          <option value="restricted">Restricted</option>
          <option value="confidential">Confidential</option>
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setView('table')}
            className={`p-2 rounded ${view === 'table' ? 'bg-primary text-white' : 'text-text-muted hover:bg-bg'}`}
            title="Table view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded ${view === 'grid' ? 'bg-primary text-white' : 'text-text-muted hover:bg-bg'}`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading documents…" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadDocuments} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No documents found"
          description={search || filterClass ? 'Try adjusting your search or filters.' : 'No documents are accessible to your role.'}
        />
      ) : view === 'table' ? (
        <div className="card overflow-hidden p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="px-5 py-3 text-left font-medium text-text-muted">Document</th>
                <th className="px-3 py-3 text-left font-medium text-text-muted">Dept</th>
                <th className="px-3 py-3 text-left font-medium text-text-muted">Subject</th>
                <th className="px-3 py-3 text-left font-medium text-text-muted">Classification</th>
                <th className="px-3 py-3 text-left font-medium text-text-muted">Uploaded By</th>
                <th className="px-3 py-3 text-left font-medium text-text-muted">Created</th>
                <th className="px-5 py-3 text-left font-medium text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => <DocumentRow key={doc.document_id} doc={doc} />)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(doc => <DocumentCard key={doc.document_id} doc={doc} />)}
        </div>
      )}

      <p className="text-xs text-text-muted">
        {filtered.length} of {documents.length} document{documents.length !== 1 ? 's' : ''} shown ·
        Access is enforced by the Zero-Trust engine when you open a document
      </p>
    </div>
  );
}
