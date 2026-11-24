import React, { useState } from 'react';
import { FileText, Upload, Search, Lock, Archive } from 'lucide-react';
import { ClassificationBadge, StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_DOCUMENTS } from '../../mocks/data';
import { formatRelative, formatBytes } from '../../utils/format';

export default function DocumentMgmtPage() {
  const [search, setSearch] = useState('');
  const docs = MOCK_DOCUMENTS.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-text">Document Management</h1><p className="text-sm text-text-muted mt-1">Upload, classify, and manage institutional documents.</p></div>
        <Button variant="primary" size="sm"><Upload className="w-4 h-4" /> Upload Document</Button>
      </div>
      <div className="card px-4 py-3 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="search" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select className="input w-auto"><option>All Depts</option></select>
        <select className="input w-auto"><option>All Classifications</option></select>
      </div>
      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-bg border-b border-border">
            <tr>{['Name', 'Dept', 'Subject', 'Classification', 'Owner', 'Size', 'Updated', 'Status', ''].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {docs.map(doc => (
              <tr key={doc.document_id} className="border-b border-border hover:bg-bg">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-text-muted flex-shrink-0" /><span className="font-medium text-text">{doc.title}</span></div></td>
                <td className="px-4 py-3 text-text-muted text-xs">{doc.department}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{doc.subject_id ?? '—'}</td>
                <td className="px-4 py-3"><ClassificationBadge classification={doc.classification} /></td>
                <td className="px-4 py-3 text-xs text-text-muted">{doc.uploader_name}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{doc.file_size ? formatBytes(doc.file_size) : '—'}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{formatRelative(doc.created_at)}</td>
                <td className="px-4 py-3">{doc.emergency_locked ? <StatusBadge variant="danger" label="Locked" /> : <StatusBadge variant="success" label="Active" />}</td>
                <td className="px-4 py-3"><div className="flex gap-1"><button className="p-1.5 rounded hover:bg-bg text-text-muted" title="Lock"><Lock className="w-3.5 h-3.5" /></button><button className="p-1.5 rounded hover:bg-bg text-text-muted" title="Archive"><Archive className="w-3.5 h-3.5" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
