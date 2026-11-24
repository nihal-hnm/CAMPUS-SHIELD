import React from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_REQUESTS } from '../../mocks/data';
import { formatRelative } from '../../utils/format';

export default function AccessRequestsAdminPage() {
  const pending = MOCK_REQUESTS.filter(r => r.status === 'pending');
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold text-text">Access Request Approvals</h1><p className="text-sm text-text-muted mt-1">{pending.length} pending request{pending.length !== 1 ? 's' : ''} awaiting review.</p></div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg border-b border-border">
            <tr>{['Requester', 'Role', 'Resource', 'Permission', 'Reason', 'Submitted', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {MOCK_REQUESTS.map(r => (
              <tr key={r.id} className="border-b border-border hover:bg-bg">
                <td className="px-4 py-3 font-medium text-text">{r.requester_name}</td>
                <td className="px-4 py-3 text-text-muted capitalize text-xs">{r.requester_role?.replace('_',' ')}</td>
                <td className="px-4 py-3 text-text-muted">{r.resource_title ?? r.resource_id}</td>
                <td className="px-4 py-3 capitalize text-text-muted">{r.permission}</td>
                <td className="px-4 py-3 text-text-muted max-w-[160px] truncate">{r.reason}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{formatRelative(r.submitted_at)}</td>
                <td className="px-4 py-3"><StatusBadge variant={r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'danger'} label={r.status} /></td>
                <td className="px-4 py-3"><div className="flex gap-1"><Button variant="primary" size="sm">Approve</Button><Button variant="danger" size="sm">Reject</Button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
