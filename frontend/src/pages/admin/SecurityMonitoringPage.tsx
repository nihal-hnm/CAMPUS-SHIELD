import React from 'react';
import { Activity } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MOCK_AUDIT_LOGS } from '../../mocks/data';
import { formatDateTime } from '../../utils/format';

export default function SecurityMonitoringPage() {
  const denied = MOCK_AUDIT_LOGS.filter(l => l.action === 'DENY');
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold text-text">Security Monitoring</h1><p className="text-sm text-text-muted mt-1">Near real-time view of access and denial activity.</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Total Events (24h)', MOCK_AUDIT_LOGS.length, 'neutral'],['Denied Requests', denied.length, 'danger'],['Anomalies Flagged', 0, 'warning'],['Active Incidents', 0, 'neutral']].map(([label, val, variant]) => (
          <div key={label as string} className="card p-4"><p className="text-xs text-text-muted">{label}</p><p className={`text-2xl font-semibold ${variant === 'danger' ? 'text-danger' : variant === 'warning' ? 'text-warning' : 'text-text'}`}>{val}</p></div>
        ))}
      </div>
      <div className="card">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /><h2 className="text-base font-semibold text-text">Live Denial Feed</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-bg border-b border-border"><tr>{['Time','User','Document','Reason Code','IP'].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {denied.map(log => (
              <tr key={log.log_id} className="border-b border-border hover:bg-bg">
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{formatDateTime(log.timestamp)}</td>
                <td className="px-4 py-3 text-sm font-medium text-text">{log.user_name}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{log.document_title ?? '—'}</td>
                <td className="px-4 py-3"><span className="font-mono text-xs bg-danger-soft text-danger px-2 py-0.5 rounded">{log.reason_code ?? 'UNKNOWN'}</span></td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{log.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
