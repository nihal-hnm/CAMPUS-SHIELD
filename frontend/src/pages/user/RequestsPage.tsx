import { useState } from 'react';
import { EmptyState } from '../../components/feedback/States';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MOCK_REQUESTS, MOCK_DOCUMENTS, saveRequests } from '../../mocks/data';
import { formatRelative, sameDepartment } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import type { AccessRequest } from '../../types/permission';
import { useAuth } from '../../context/AuthContext';
import { X, ChevronDown, Plus } from 'lucide-react';

export default function AccessRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>(
    MOCK_REQUESTS.filter(r => r.requester_id === user?.uid)
  );
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ resource_id: '', permission: 'view', reason: '' });
  const [error, setError] = useState('');

  const statusVariant: Record<string, any> = {
    pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'neutral', expired: 'neutral',
  };

  function handleSubmit() {
    setError('');
    if (!form.resource_id || !form.reason) { setError('Please select a document and provide a reason.'); return; }
    const doc = MOCK_DOCUMENTS.find(d => d.document_id === form.resource_id);
    const req: AccessRequest = {
      id: `REQ_${Math.random().toString(36).substring(2,8).toUpperCase()}`,
      requester_id: user!.uid,
      requester_name: user!.name,
      requester_role: user!.role,
      resource_id: form.resource_id,
      resource_title: doc?.title ?? form.resource_id,
      resource_type: 'document' as const,
      permission: form.permission as any,
      reason: form.reason,
      submitted_at: new Date().toISOString(),
      status: 'pending',
    };
    MOCK_REQUESTS.push(req);
    saveRequests();
    setRequests(MOCK_REQUESTS.filter(r => r.requester_id === user?.uid));
    setForm({ resource_id: '', permission: 'view', reason: '' });
    setShowNew(false);
  }

  function handleCancel(id: string) {
    const idx = MOCK_REQUESTS.findIndex(r => r.id === id);
    if (idx > -1) {
      MOCK_REQUESTS[idx] = { ...MOCK_REQUESTS[idx], status: 'cancelled' };
      saveRequests();
    }
    setRequests(MOCK_REQUESTS.filter(r => r.requester_id === user?.uid));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Access Requests</h1>
          <p className="text-sm text-text-muted mt-1">Request access to documents you need.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowNew(v => !v)}>
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {/* New Request Form */}
      {showNew && (
        <div className="card p-5 border border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text">New Access Request</h2>
            <button onClick={() => setShowNew(false)} className="p-1 hover:bg-bg rounded text-text-muted"><X className="w-4 h-4" /></button>
          </div>
          {error && <div className="mb-3 p-2.5 rounded bg-danger-soft text-danger text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Document *</label>
              <div className="relative">
                <select className="input w-full text-sm appearance-none pr-8" value={form.resource_id} onChange={e => setForm(v => ({...v, resource_id: e.target.value}))}>
                  <option value="">Select document…</option>
                  {MOCK_DOCUMENTS.filter(d => sameDepartment(d.department, user?.department)).map(d => <option key={d.document_id} value={d.document_id}>{d.title}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Access Level *</label>
              <div className="relative">
                <select className="input w-full text-sm appearance-none pr-8" value={form.permission} onChange={e => setForm(v => ({...v, permission: e.target.value}))}>
                  <option value="view">View</option>
                  <option value="download">Download</option>
                  <option value="print">Print</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">Reason *</label>
              <textarea className="input w-full text-sm resize-none" rows={3} placeholder="Explain why you need access…" value={form.reason} onChange={e => setForm(v => ({...v, reason: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit}>Submit Request</Button>
          </div>
        </div>
      )}

      {/* Request List */}
      {requests.length === 0 ? (
        <EmptyState
          title="No access requests"
          description="You haven't made any access requests yet."
          action={<Button variant="secondary" size="sm" onClick={() => setShowNew(true)}>New Request</Button>}
        />
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-bg border-b border-border">
              <tr>
                {['Request ID','Resource','Permission','Reason','Submitted','Status','Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} className="border-b border-border hover:bg-bg">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{r.id}</td>
                  <td className="px-4 py-3 font-medium text-text">{r.resource_title ?? r.resource_id}</td>
                  <td className="px-4 py-3 text-text-muted capitalize">{r.permission}</td>
                  <td className="px-4 py-3 text-text-muted max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
                  <td className="px-4 py-3 text-text-muted">{formatRelative(r.submitted_at)}</td>
                  <td className="px-4 py-3"><StatusBadge variant={statusVariant[r.status] ?? 'neutral'} label={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && (
                      <button onClick={() => handleCancel(r.id)} className="text-xs text-danger hover:underline">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
