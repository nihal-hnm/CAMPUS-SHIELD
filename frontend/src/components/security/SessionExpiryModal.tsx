import { Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  /** seconds remaining before idle timeout. Show warning when ≤ 120 */
  idleTimeoutSecs: number;
  onStaySignedIn: () => void;
  onSignOut: () => void;
}

export function SessionExpiryModal({ idleTimeoutSecs, onStaySignedIn, onSignOut }: Props) {
  if (idleTimeoutSecs > 120) return null;

  const mins = Math.floor(idleTimeoutSecs / 60);
  const secs = idleTimeoutSecs % 60;
  const display = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const urgent = idleTimeoutSecs <= 30;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/40" />
      <div className={`relative bg-surface rounded shadow-modal w-full max-w-sm p-5 border-t-4 ${urgent ? 'border-danger' : 'border-warning'}`}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${urgent ? 'bg-danger-soft' : 'bg-warning-soft'}`}>
            {urgent
              ? <AlertTriangle className="w-5 h-5 text-danger" />
              : <Clock className="w-5 h-5 text-warning" />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Session expiring soon</p>
            <p className="text-xs text-text-muted mt-0.5">
              You'll be signed out in <span className={`font-semibold font-mono ${urgent ? 'text-danger' : 'text-warning'}`}>{display}</span> due to inactivity.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" className="flex-1" onClick={onStaySignedIn}>Stay signed in</Button>
          <Button variant="ghost" size="sm" onClick={onSignOut}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}
