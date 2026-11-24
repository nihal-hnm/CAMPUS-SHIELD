import { useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_REQUESTS } from '../../mocks/data';
import { formatRelative } from '../../utils/format';
import type { AccessRequest } from '../../types/permission';
import { CheckCircle, XCircle, Clock, Inbox } from 'lucide-react';

export default function AccessRequestsAdminPage() {
  const [requests, setRequests] = useState<AccessRequest[]>(MOCK_REQUESTS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  function approve(id: string) {
    const idx = MOCK_REQUESTS.findIndex(r => r.id === id);
    if (idx > -1) MOCK_REQUESTS[idx] = { ...MOCK_REQUESTS[idx], status: 'approved' };
    setRequests([...MOCK_REQUESTS]);
  }

  function reject(id: string) {
    const idx = MOCK_REQUESTS.findIndex(r => r.id === id);
    if (idx > -1) MOCK_REQUESTS[idx] = { ...MOCK_REQUESTS[idx], status: 'rejected' };
    setRequests([...MOCK_REQUESTS]);
  }

  const stats = [
    { label: 'Total',    val: requests.length,                                   icon: Inbox,       color: 'text-text-muted' },
    { label: 'Pending',  val: pendingCount,                                       icon: Clock,       color: 'text-warning' },
    { label: 'Approved', val: requests.filter(r => r.status === 'approved').length, icon: CheckCircle, color: 'text-success' },
    { label: 'Rejected', val: requests.filter(r => r.status === 'rejected').length, icon: XCircle,    color: 'text-danger' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-text">Access Request Approvals</h1>
        <p className="text-sm text-text-muted mt-1">{pendingCount} pending request{pendingCount !== 1 ? 's' : ''} awaiting your review.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <s.icon className={`w-5 h-5 ${s.color} flex-shrink-0`} />
            <div>
              <p className="text-xl font-bold text-text">{s.val}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-bg rounded-lg w-fit border border-border">
        {(['all','pending','approved','rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              filter === f ? 'bg-surface shadow text-text' : 'text-text-muted hover:text-text'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-bg border-b border-border">
            <tr>
              {['Requester','Role','Resource','Permission','Reason','Submitted','Status','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-text-muted text-sm">
                  No {filter === 'all' ? '' : filter} requests found.
                </td>
              </tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-border hover:bg-bg">
                <td className="px-4 py-3 font-medium text-text">{r.requester_name}</td>
                <td className="px-4 py-3 text-text-muted capitalize text-xs">{r.requester_role?.replace('_',' ')}</td>
                <td className="px-4 py-3 text-text-muted max-w-[150px] truncate">{r.resource_title ?? r.resource_id}</td>
                <td className="px-4 py-3 capitalize text-text-muted">{r.permission}</td>
                <td className="px-4 py-3 text-text-muted max-w-[160px] truncate" title={r.reason}>{r.reason}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{formatRelative(r.submitted_at)}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    variant={r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'danger'}
                    label={r.status}
                  />
                </td>
                <td className="px-4 py-3">
                  {r.status === 'pending' ? (
                    <div className="flex gap-1">
                      <Button variant="primary" size="sm" onClick={() => approve(r.id)}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => reject(r.id)}>
                        <XCircle className="w-3.5 h-3.5" /> Deny
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted italic">Resolved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
