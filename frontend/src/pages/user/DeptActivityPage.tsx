import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MOCK_AUDIT_LOGS } from '../../mocks/data';
import { formatDateTime } from '../../utils/format';

export default function DeptActivityPage() {
  const { user } = useAuth();
  const logs = MOCK_AUDIT_LOGS.filter(l => l.user_role !== 'super_admin');
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-text">Department Activity</h1>
        <p className="text-sm text-text-muted mt-1">Read-only departmental document access events for {user?.department}.</p>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg border-b border-border">
            <tr>
              {['Time', 'Person', 'Document', 'Action', 'Result', 'Reason'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.log_id} className="border-b border-border hover:bg-bg">
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{formatDateTime(log.timestamp)}</td>
                <td className="px-4 py-3 font-medium text-text">{log.user_name ?? log.user_id}</td>
                <td className="px-4 py-3 text-text-muted max-w-[160px] truncate">{log.document_title ?? log.document_id ?? '—'}</td>
                <td className="px-4 py-3 text-text-muted capitalize">{log.event_type ?? 'access'}</td>
                <td className="px-4 py-3"><StatusBadge variant={log.action === 'ALLOW' ? 'success' : 'danger'} label={log.action} /></td>
                <td className="px-4 py-3 text-text-muted text-xs max-w-[200px] truncate">{log.failure_reason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
