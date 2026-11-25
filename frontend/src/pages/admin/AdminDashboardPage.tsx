import React, { useState, useEffect } from 'react';
import { Users, FileText, Shield, AlertTriangle, Activity, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_AUDIT_LOGS, MOCK_USERS, MOCK_DOCUMENTS, MOCK_REQUESTS } from '../../mocks/data';
import { syncAllFromSupabase } from '../../services/dbSync';
import { formatRole } from '../../constants/roles';
import { formatDateTime, formatRelative } from '../../utils/format';

function StatCard({ label, value, sub, icon: Icon, to, variant = 'default' }: {
  label: string; value: number | string; sub?: string;
  icon: React.ComponentType<{ className?: string }>; to?: string; variant?: 'default' | 'danger' | 'warning';
}) {
  const colors: Record<string, string> = {
    default: 'bg-primary-soft text-primary',
    danger:  'bg-danger-soft text-danger',
    warning: 'bg-warning-soft text-warning',
  };
  const inner = (
    <div className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${colors[variant]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-2xl font-semibold text-text">{value}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function AdminDashboardPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [, setTick] = useState(0);

  const refresh = async () => {
    await syncAllFromSupabase();
    setLastUpdated(new Date());
    setTick(t => t + 1);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const deniedToday = MOCK_AUDIT_LOGS.filter(l => l.action === 'DENY').length;
  const pendingReqs = MOCK_REQUESTS.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Admin Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">System security posture overview</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-text-muted">Updated {formatRelative(lastUpdated.toISOString())}</span>
          <Button variant="secondary" size="sm" onClick={refresh}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Link to="/admin/emergency">
            <Button variant="danger" size="sm">
              <AlertTriangle className="w-4 h-4" /> Emergency Revocation
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Active Users"         value={MOCK_USERS.filter(u => u.status === 'active').length}  icon={Users}         to="/admin/users" />
        <StatCard label="Total Documents"      value={MOCK_DOCUMENTS.length}                                 icon={FileText}      to="/admin/documents" />
        <StatCard label="Pending Requests"     value={pendingReqs}                                           icon={Shield}        to="/admin/requests" variant="warning" />
        <StatCard label="Denied (24h)"         value={deniedToday}                                           icon={AlertTriangle} variant="danger" />
        <StatCard label="Expiring Perms (24h)" value={0}                                                     icon={Shield}        variant="warning" />
        <StatCard label="Active Shared Links"  value={0}                                                     icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Real-time audit log */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-text">Recent Audit Events</h2>
            <Link to="/admin/audit" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-bg border-b border-border">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs text-text-muted font-medium">Time</th>
                <th className="text-left px-3 py-2.5 text-xs text-text-muted font-medium">User</th>
                <th className="text-left px-3 py-2.5 text-xs text-text-muted font-medium">Document</th>
                <th className="text-left px-3 py-2.5 text-xs text-text-muted font-medium">Result</th>
                <th className="text-left px-5 py-2.5 text-xs text-text-muted font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_AUDIT_LOGS.slice(0, 8).map(log => (
                <tr key={log.log_id} className="border-b border-border hover:bg-bg">
                  <td className="px-5 py-2.5 font-mono text-xs text-text-muted whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="text-xs font-medium text-text">{log.user_name ?? log.user_id}</p>
                      <p className="text-[10px] text-text-muted">{formatRole(log.user_role)}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-text-muted max-w-[140px] truncate">{log.document_title ?? log.document_id ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge variant={log.action === 'ALLOW' ? 'success' : 'danger'} label={log.action} />
                  </td>
                  <td className="px-5 py-2.5 text-xs text-text-muted max-w-[160px] truncate">{log.failure_reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick actions + Needs attention */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-base font-semibold text-text mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/admin/emergency" className="flex items-center gap-2 p-2.5 rounded hover:bg-danger-soft text-sm font-medium text-danger transition-colors">
                <AlertTriangle className="w-4 h-4" /> Emergency Revocation
              </Link>
              <Link to="/admin/documents" className="flex items-center gap-2 p-2.5 rounded hover:bg-bg text-sm text-text transition-colors">
                <FileText className="w-4 h-4 text-text-muted" /> Upload Document
              </Link>
              <Link to="/admin/permissions" className="flex items-center gap-2 p-2.5 rounded hover:bg-bg text-sm text-text transition-colors">
                <Shield className="w-4 h-4 text-text-muted" /> Grant Permission
              </Link>
              <Link to="/admin/requests" className="flex items-center gap-2 p-2.5 rounded hover:bg-bg text-sm text-text transition-colors">
                <Users className="w-4 h-4 text-text-muted" /> Review Requests
                {pendingReqs > 0 && <span className="ml-auto text-[10px] font-semibold bg-warning text-white rounded-full px-1.5 py-0.5">{pendingReqs}</span>}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
