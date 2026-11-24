import { useEffect, useState, useRef } from 'react';

/** Returns true when the signed-in session has lasted ≥ reauthAfterMs (default 90 min) */
export function useReauthRequired(signinTime: number | null, reauthAfterMs = 90 * 60 * 1000): boolean {
  const [required, setRequired] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!signinTime) { setRequired(false); return; }
    const check = () => setRequired(Date.now() - signinTime >= reauthAfterMs);
    check();
    timer.current = setInterval(check, 30_000); // check every 30s
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [signinTime, reauthAfterMs]);

  return required;
}

/** Countdown in seconds until the idle timeout fires */
export function useIdleCountdown(lastActivity: () => number, idleMs = 10 * 60 * 1000): number {
  const [seconds, setSeconds] = useState<number>(idleMs / 1000);
  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, idleMs - (Date.now() - lastActivity())) / 1000;
      setSeconds(Math.floor(remaining));
    }, 1000);
    return () => clearInterval(id);
  }, [lastActivity, idleMs]);
  return seconds;
}
