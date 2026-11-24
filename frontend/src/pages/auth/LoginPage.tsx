import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Lock, Clock, FileCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, PasswordInput } from '../../components/ui/Input';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { useAuth } from '../../context/AuthContext';
import { LOGIN_FAILURE_REASONS } from '../../constants/denialReasons';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = params.get('returnUrl') ?? '/';
  const sessionMsg = params.get('reason');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailErr, setEmailErr] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setEmailErr('Email or ID is required'); return; }
    setEmailErr(''); setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate(returnUrl, { replace: true });
    } catch (err: any) {
      const code = err?.reason_code ?? 'INVALID_CREDENTIALS';
      setError(LOGIN_FAILURE_REASONS[code] ?? err?.message ?? 'Sign in failed. Try again.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  const sessionReason = sessionMsg
    ? `You were signed out: ${sessionMsg.replace(/_/g, ' ').toLowerCase()}.`
    : null;

  return (
    <div className="min-h-screen flex">
      {/* Left navy panel */}
      <div className="hidden lg:flex flex-col justify-between bg-navy text-text-on-navy p-12 w-[480px] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" strokeWidth={2} />
          <span className="text-xl font-semibold text-white">CampusShield</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-white leading-snug mb-4">
            Zero-Trust Campus<br />Document Security
          </h1>
          <p className="text-text-on-navy-muted text-sm mb-10 leading-relaxed">
            Smart Access. Instant Control. Complete Transparency.
          </p>
          <div className="space-y-5">
            {[
              { icon: Lock,      text: 'Every request is authorized by the backend in real time.' },
              { icon: Clock,     text: 'Access expires automatically — idle, re-auth, and link TTLs enforced.' },
              { icon: FileCheck, text: 'Every allow and deny decision is permanently audited.' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-on-navy">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-text-on-navy-muted">NexHack 2.0 · Problem Statement PS 07</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold text-text">CampusShield</span>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-semibold text-text mb-1">Sign in to CampusShield</h2>
            <p className="text-sm text-text-muted mb-6">Use your institutional ID or email</p>

            {sessionReason && <InlineAlert type="info" message={sessionReason} className="mb-4" />}
            {error && <InlineAlert type="error" message={error} className="mb-4" />}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Institutional ID / Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => !email && setEmailErr('Email or ID is required')}
                placeholder="you@college.edu"
                error={emailErr}
                autoComplete="email"
                autoFocus
              />
              <PasswordInput
                label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
                Sign in
              </Button>
            </form>

            <p className="text-xs text-text-muted text-center mt-6">
              Contact your administrator for account issues.
            </p>

            {/* Demo credentials hint */}
            <div className="mt-4 p-3 bg-bg rounded border border-border text-xs text-text-muted space-y-1">
              <p className="font-medium text-text">Demo Credentials</p>
              <p>Admin: <span className="font-mono">admin@college.edu / admin123</span></p>
              <p>HOD: <span className="font-mono">hod@cse.college.edu / hod123</span></p>
              <p>Faculty: <span className="font-mono">fac1@college.edu / fac123</span></p>
              <p>Student: <span className="font-mono">student@college.edu / stu123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
