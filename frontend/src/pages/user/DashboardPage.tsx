import { FileText, KeyRound, Inbox, AlertTriangle, BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ClassificationBadge } from '../../components/ui/StatusBadge';
import { MOCK_DOCUMENTS, MOCK_PERMISSIONS, MOCK_REQUESTS } from '../../mocks/data';
import { formatRelative, formatCountdown, sameDepartment } from '../../utils/format';
import { formatRole } from '../../constants/roles';

function StatCard({ label, value, sub, icon: Icon, to }: { label: string; value: number | string; sub?: string; icon: React.ComponentType<{ className?: string }>; to?: string }) {
  const inner = (
    <div className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded bg-primary-soft flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-2xl font-semibold text-text tabular-nums">{value}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function UserDashboardPage() {
  const { user } = useAuth();

  const deptDocs = MOCK_DOCUMENTS.filter(d => sameDepartment(d.department, user?.department));
  const recentDocs = deptDocs.slice(0, 5);
  const myPerms = MOCK_PERMISSIONS.filter(p => p.user_id === user?.uid);
  const expiring = myPerms.filter(p => p.expires_at).slice(0, 3);
  const pendingReqs = MOCK_REQUESTS.filter(r => r.requester_id === user?.uid && r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">{user?.department} · {formatRole(user?.role)} workspace</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Accessible Documents" value={deptDocs.length} icon={FileText} to="/library" />
        <StatCard label="Active Permissions"   value={myPerms.length} icon={KeyRound} />
        <StatCard label="Pending Requests"     value={pendingReqs.length} icon={Inbox} to="/requests" />
        <StatCard label="Expiring in 24h"      value={expiring.length} sub="permissions" icon={AlertTriangle} />
      </div>

      {/* Faculty subjects */}
      {user?.role === 'faculty' && user.assigned_subjects.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-text mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Assigned Subjects
          </h2>
          <div className="flex flex-wrap gap-2">
            {user.assigned_subjects.map(s => (
              <span key={s} className="px-3 py-1 bg-primary-soft text-primary text-sm font-medium rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recently accessed */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-text">Recently Accessed</h2>
            <Link to="/library" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-bg border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 text-xs text-text-muted font-medium">Document</th>
                <th className="text-left px-3 py-3 text-xs text-text-muted font-medium">Classification</th>
                <th className="text-left px-3 py-3 text-xs text-text-muted font-medium">Dept</th>
                <th className="text-right px-5 py-3 text-xs text-text-muted font-medium">Last Opened</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.map(doc => (
                <tr key={doc.document_id} className="border-b border-border hover:bg-bg cursor-pointer"
                    onClick={() => window.location.href = `/documents/${doc.document_id}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                      <span className="font-medium text-text truncate max-w-[200px]">{doc.title}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3"><ClassificationBadge classification={doc.classification} /></td>
                  <td className="px-3 py-3 text-text-muted">{doc.department}</td>
                  <td className="px-5 py-3 text-right text-text-muted text-xs">{formatRelative(doc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expiring soon */}
        <div className="card">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-text">Expiring Soon</h2>
          </div>
          <div className="p-5">
            {expiring.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No permissions expiring soon.</p>
            ) : (
              expiring.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text truncate max-w-[140px]">{p.resource_title ?? p.resource_id}</p>
                    <p className="text-xs text-text-muted capitalize">{p.level}</p>
                  </div>
                  <span className="text-xs text-warning font-medium">
                    {p.expires_at ? formatCountdown(p.expires_at) : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
