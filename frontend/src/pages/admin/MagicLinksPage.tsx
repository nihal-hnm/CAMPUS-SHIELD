import { useState } from 'react';
import { Link2, Copy, Clock, Shield, Trash2, Plus, X, ChevronDown, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { MOCK_DOCUMENTS, MOCK_MAGIC_LINKS, type MagicLink } from '../../mocks/data';
import { useAuth } from '../../context/AuthContext';

function genToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2,'0')).join('');
}

function formatExpiry(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'Expired';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m left`;
  return `${Math.floor(mins/60)}h ${mins%60}m left`;
}

export default function MagicLinksPage() {
  const { user } = useAuth();
  const isHod = user?.role === 'dept_admin';
  const hodDept = user?.department;
  const availableDocs = isHod ? MOCK_DOCUMENTS.filter(d => d.department === hodDept) : MOCK_DOCUMENTS;
  const [links, setLinks] = useState<MagicLink[]>(MOCK_MAGIC_LINKS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ document_id: '', expires_minutes: 60 });
  const [copied, setCopied] = useState<string | null>(null);

  function createLink() {
    if (!form.document_id) return;
    const doc = MOCK_DOCUMENTS.find(d => d.document_id === form.document_id);
    const token = genToken();
    const link: MagicLink = {
      token,
      document_id: form.document_id,
      document_title: doc?.title ?? form.document_id,
      created_by: user!.uid,
      created_by_name: user!.name,
      expires_at: new Date(Date.now() + form.expires_minutes * 60000).toISOString(),
      accessed: false,
    };
    MOCK_MAGIC_LINKS.unshift(link);
    setLinks([...MOCK_MAGIC_LINKS]);
    setForm({ document_id: '', expires_minutes: 60 });
    setShowCreate(false);
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/magic/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function revokeLink(token: string) {
    const idx = MOCK_MAGIC_LINKS.findIndex(l => l.token === token);
    if (idx > -1) MOCK_MAGIC_LINKS.splice(idx, 1);
    setLinks([...MOCK_MAGIC_LINKS]);
  }

  const visibleLinks = isHod
    ? links.filter(l => {
        const doc = MOCK_DOCUMENTS.find(d => d.document_id === l.document_id);
        return doc ? doc.department === hodDept : l.created_by === user?.uid;
      })
    : links;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Magic Links</h1>
          <p className="text-sm text-text-muted mt-1">Generate temporary time-limited access links for documents.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(v => !v)}>
          <Plus className="w-4 h-4" /> Create Magic Link
        </Button>
      </div>

      {/* Info Banner */}
      <div className="card p-4 border border-primary/20 bg-primary-soft flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text">Zero-Trust Temporary Access</p>
          <p className="text-xs text-text-muted mt-0.5">Magic links grant one-time, time-limited access to a specific document. No login required — link expires after set duration or first use. Never share via insecure channels.</p>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card p-5 border border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text">Generate Magic Link</h2>
            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-bg rounded text-text-muted"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Document *</label>
              <div className="relative">
                <select className="input w-full text-sm appearance-none pr-8" value={form.document_id} onChange={e => setForm(v => ({...v, document_id: e.target.value}))}>
                  <option value="">Select document…</option>
                  {availableDocs.map(d => <option key={d.document_id} value={d.document_id}>{d.title}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Expires In</label>
              <div className="relative">
                <select className="input w-full text-sm appearance-none pr-8" value={form.expires_minutes} onChange={e => setForm(v => ({...v, expires_minutes: Number(e.target.value)}))}>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={180}>3 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="p-3 mt-3 rounded bg-bg border border-border text-xs text-text-muted">
            <p>⚠️ This link grants <strong>view-only</strong> access to the document for anyone with the URL — no login required. It expires at <strong>{new Date(Date.now() + form.expires_minutes * 60000).toLocaleString()}</strong>.</p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={createLink} disabled={!form.document_id}>Generate Link</Button>
          </div>
        </div>
      )}

      {/* Links Table */}
      {visibleLinks.length === 0 ? (
        <div className="card p-10 text-center text-text-muted text-sm">No magic links created yet. Click "Create Magic Link" to get started.</div>
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-bg border-b border-border">
              <tr>
                {['Document','Created By','Expires','Status','Link','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleLinks.map(l => {
                const expired = new Date(l.expires_at) < new Date();
                const visibleLinks = isHod
    ? links.filter(l => {
        const doc = MOCK_DOCUMENTS.find(d => d.document_id === l.document_id);
        return doc ? doc.department === hodDept : l.created_by === user?.uid;
      })
    : links;

  return (
                  <tr key={l.token} className="border-b border-border hover:bg-bg">
                    <td className="px-4 py-3 font-medium text-text">{l.document_title}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{l.created_by_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        <span className={`text-xs ${expired ? 'text-danger' : 'text-text-muted'}`}>
                          {formatExpiry(l.expires_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        expired ? 'bg-red-100 text-red-700' :
                        l.accessed ? 'bg-gray-100 text-gray-600' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {expired ? 'Expired' : l.accessed ? 'Used' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[10px] font-mono text-text-muted bg-bg px-1.5 py-0.5 rounded border border-border">
                        {l.token.substring(0,16)}…
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {!expired && (
                          <button onClick={() => copyLink(l.token)}
                            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-bg text-primary font-medium">
                            {copied === l.token ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied === l.token ? 'Copied!' : 'Copy'}
                          </button>
                        )}
                        <button onClick={() => revokeLink(l.token)} className="p-1.5 rounded hover:bg-danger-soft text-danger" title="Revoke">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
