import { useState, useMemo, useEffect } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_AUDIT_LOGS } from '../../mocks/data';
import { syncAllFromSupabase } from '../../services/dbSync';
import { formatDateTime } from '../../utils/format';
import { formatRole } from '../../constants/roles';
import { Search, Download, RefreshCw } from 'lucide-react';
import type { AuditLog } from '../../types/audit';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const reload = async () => {
    setRefreshing(true);
    await syncAllFromSupabase();
    setLogs([...MOCK_AUDIT_LOGS]);
    setRefreshing(false);
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return logs.filter(log => {
      if (filterAction && log.action !== filterAction) return false;
      if (filterRole && log.user_role !== filterRole) return false;
      if (!q) return true;
      return (
        (log.user_name ?? '').toLowerCase().includes(q) ||
        log.user_id.toLowerCase().includes(q) ||
        (log.document_title ?? '').toLowerCase().includes(q) ||
        (log.document_id ?? '').toLowerCase().includes(q) ||
        (log.failure_reason ?? '').toLowerCase().includes(q) ||
        (log.reason_code ?? '').toLowerCase().includes(q)
      );
    });
  }, [logs, search, filterAction, filterRole]);

  function exportCsv() {
    const header = ['Timestamp', 'User ID', 'User Name', 'Role', 'Document', 'Result', 'Reason Code', 'Reason', 'IP'];
    const rows = filtered.map(l => [
      l.timestamp,
      l.user_id,
      l.user_name ?? '',
      formatRole(l.user_role),
      l.document_title ?? l.document_id ?? '',
      l.action,
      l.reason_code ?? '',
      (l.failure_reason ?? '').replace(/,/g, ';'),
      l.ip_address,
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campusshield_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Audit Logs</h1>
          <p className="text-sm text-text-muted mt-1">
            Immutable record of all access decisions. Every ALLOW and DENY is logged ({filtered.length} shown).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={reload} loading={refreshing}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="card px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            placeholder="Search logs by user, document, or reason…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select className="input w-auto text-sm" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">All Actions</option>
          <option value="DENY">DENY</option>
          <option value="ALLOW">ALLOW</option>
        </select>
        <select className="input w-auto text-sm" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="ultra_admin">Ultra Admin</option>
          <option value="super_admin">Admin</option>
          <option value="dept_admin">H.O.D</option>
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
          <option value="unknown">Unauthenticated / Unknown</option>
        </select>
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-text-muted text-sm">
                  No audit events recorded yet. Sign-ins, document opens, and lockdowns will appear here.
                </td>
              </tr>
            ) : filtered.map(log => (
              <tr key={log.log_id} className={`border-b border-border hover:bg-bg ${log.action === 'DENY' ? 'bg-danger-soft/30' : ''}`}>
                <td className="px-4 py-3 font-mono text-xs text-text-muted whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{log.user_name ?? log.user_id}</p>
                  <p className="font-mono text-[10px] text-text-muted">{log.user_id}</p>
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">{formatRole(log.user_role)}</td>
                <td className="px-4 py-3">
                  {log.special_tags.length > 0
                    ? <span className="badge badge-info text-[10px]">{log.special_tags.join(', ')}</span>
                    : <span className="text-text-muted text-xs">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-xs text-text-muted max-w-[160px] truncate">{log.document_title ?? log.document_id ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge variant={log.action === 'ALLOW' ? 'success' : 'danger'} label={log.action} /></td>
                <td className="px-4 py-3 text-xs text-text-muted max-w-[220px] font-mono">{log.failure_reason ?? log.reason_code ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{log.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
