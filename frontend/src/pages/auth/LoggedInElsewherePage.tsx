import { MonitorSmartphone, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoggedInElsewherePage() {
  const { forceRelogin } = useAuth();
  const navigate = useNavigate();

  function handleLogin() {
    forceRelogin();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-warning-soft flex items-center justify-center mx-auto">
          <MonitorSmartphone className="w-8 h-8 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Logged in elsewhere</h1>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            Your account was signed in from another device or browser tab. For security, only one active session is allowed at a time.
          </p>
        </div>
        <div className="card p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">What happened?</p>
          <p className="text-sm text-text-muted">Someone signed into your account on another device. Your session here has been ended automatically.</p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign in Again (this device)
        </button>
        <p className="text-xs text-text-muted">
          Signing in here will end the session on the other device.
        </p>
      </div>
    </div>
  );
}
