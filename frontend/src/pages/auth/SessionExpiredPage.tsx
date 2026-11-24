import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SESSION_EXPIRY_REASONS } from '../../constants/denialReasons';

export default function SessionExpiredPage() {
  const [params] = useSearchParams();
  const reason = params.get('reason') ?? 'SESSION_INVALID';
  const returnUrl = params.get('returnUrl') ?? '/';
  const isEmergency = reason === 'EMERGENCY_REVOCATION';

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold text-text">CampusShield</span>
        </div>
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-warning-soft flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Your session has ended</h2>
          <p className="text-sm text-text-muted mb-6">
            {SESSION_EXPIRY_REASONS[reason] ?? SESSION_EXPIRY_REASONS.SESSION_INVALID}
          </p>
          {isEmergency ? (
            <p className="text-sm text-danger font-medium">Contact your administrator for further assistance.</p>
          ) : (
            <Link to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}>
              <Button variant="primary" size="lg" className="w-full">Sign in again</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
