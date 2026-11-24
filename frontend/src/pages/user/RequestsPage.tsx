import React from 'react';
import { EmptyState } from '../../components/feedback/States';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MOCK_REQUESTS } from '../../mocks/data';
import { formatRelative } from '../../utils/format';
import { Button } from '../../components/ui/Button';

export default function AccessRequestsPage() {
  const requests = MOCK_REQUESTS;
  const statusVariant: Record<string, any> = {
    pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'neutral', expired: 'neutral',
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Access Requests</h1>
          <p className="text-sm text-text-muted mt-1">Track and manage your document access requests.</p>
        </div>
        <Button variant="primary" size="sm">New Request</Button>
      </div>
      {requests.length === 0 ? (
        <EmptyState title="No access requests" description="You haven't made any access requests yet." action={<Button variant="secondary" size="sm">New Request</Button>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg border-b border-border">
              <tr>
                {['Request ID', 'Resource', 'Permission', 'Reason', 'Submitted', 'Status'].map(h => (
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
                  <td className="px-4 py-3 text-text-muted max-w-[200px] truncate">{r.reason}</td>
                  <td className="px-4 py-3 text-text-muted">{formatRelative(r.submitted_at)}</td>
                  <td className="px-4 py-3"><StatusBadge variant={statusVariant[r.status] ?? 'neutral'} label={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
