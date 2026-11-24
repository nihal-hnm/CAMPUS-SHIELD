import React from 'react';
import { StatusBadge, ClassificationBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_AUDIT_LOGS } from '../../mocks/data';
import { formatDateTime } from '../../utils/format';
import { Search, Download } from 'lucide-react';

export default function AuditLogsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Audit Logs</h1>
          <p className="text-sm text-text-muted mt-1">Immutable record of all access decisions. Every ALLOW and DENY is logged.</p>
        </div>
        <Button variant="secondary" size="sm"><Download className="w-4 h-4" /> Export CSV</Button>
      </div>

      <div className="card px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="search" placeholder="Search logs…" className="input pl-9" />
        </div>
        <select className="input w-auto"><option>All Actions</option><option>DENY</option><option>ALLOW</option></select>
        <select className="input w-auto"><option>All Roles</option></select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-bg border-b border-border">
            <tr>
              {['Timestamp', 'User', 'Role', 'Tags', 'Document', 'Result', 'Reason', 'IP'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_AUDIT_LOGS.map(log => (
              <tr key={log.log_id} className={`border-b border-border hover:bg-bg ${log.action === 'DENY' ? 'bg-danger-soft/30' : ''}`}>
                <td className="px-4 py-3 font-mono text-xs text-text-muted whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{log.user_name ?? log.user_id}</p>
                  <p className="font-mono text-[10px] text-text-muted">{log.user_id}</p>
                </td>
                <td className="px-4 py-3 text-text-muted capitalize text-xs">{log.user_role.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  {log.special_tags.length > 0
                    ? <span className="badge badge-info text-[10px]">{log.special_tags.join(', ')}</span>
                    : <span className="text-text-muted text-xs">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-xs text-text-muted max-w-[160px] truncate">{log.document_title ?? log.document_id ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge variant={log.action === 'ALLOW' ? 'success' : 'danger'} label={log.action} /></td>
                <td className="px-4 py-3 text-xs text-text-muted max-w-[200px] font-mono">{log.failure_reason ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{log.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
