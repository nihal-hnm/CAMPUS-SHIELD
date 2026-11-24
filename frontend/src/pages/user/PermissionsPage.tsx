import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/feedback/States';
import { MOCK_PERMISSIONS } from '../../mocks/data';
import { formatDate, formatCountdown } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export default function MyPermissionsPage() {
  const perms = MOCK_PERMISSIONS;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">My Permissions</h1>
          <p className="text-sm text-text-muted mt-1">Your current effective permissions. Access is re-verified on every document open.</p>
        </div>
        <Link to="/requests"><Button variant="primary" size="sm">Request Permission</Button></Link>
      </div>
      <div className="card p-3 text-xs text-text-muted border-l-4 border-primary">
        🔒 This view is informational only. The backend re-authorizes every request at access time.
      </div>
      {perms.length === 0 ? (
        <EmptyState title="No direct permissions" description="Access through your role is applied automatically." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg border-b border-border">
              <tr>
                {['Resource', 'Level', 'Source', 'Granted By', 'Granted On', 'Expires', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map(p => (
                <tr key={p.id} className="border-b border-border hover:bg-bg">
                  <td className="px-4 py-3 font-medium text-text">{p.resource_title ?? p.resource_id}</td>
                  <td className="px-4 py-3 text-text-muted capitalize">{p.level}</td>
                  <td className="px-4 py-3"><StatusBadge variant="info" label={p.source} /></td>
                  <td className="px-4 py-3 text-text-muted">{p.granted_by_name ?? p.granted_by}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(p.granted_on)}</td>
                  <td className="px-4 py-3 text-text-muted">{p.expires_at ? formatCountdown(p.expires_at) : 'Never'}</td>
                  <td className="px-4 py-3"><StatusBadge variant={p.status === 'active' ? 'success' : 'neutral'} label={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
