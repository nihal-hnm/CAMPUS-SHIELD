import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PasswordInput } from '../../components/ui/Input';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { useAuth } from '../../context/AuthContext';

export default function ReauthPage() {
  const { user, reauth, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await reauth(password);
      navigate(-1);
    } catch (err: any) {
      setError(err?.message ?? 'Incorrect password.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold text-text">CampusShield</span>
        </div>
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-text mb-1">Confirm it's you</h2>
          <p className="text-sm text-text-muted mb-5">
            For your security, please sign in again. This happens every 90 minutes.
          </p>

          {/* Masked identity */}
          <div className="bg-bg rounded px-3 py-2.5 border border-border mb-5">
            <p className="text-sm font-medium text-text">{user?.name}</p>
            <p className="text-xs text-text-muted">{user?.email}</p>
          </div>

          {error && <InlineAlert type="error" message={error} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <PasswordInput
              label="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
            />
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Continue
            </Button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => logout().then(() => navigate('/login'))}
              className="text-sm text-text-muted hover:text-text underline"
            >
              Sign out instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
