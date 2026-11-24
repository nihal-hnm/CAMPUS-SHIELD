import { useEffect, useRef, useCallback } from 'react';

export function useIdleTimer(onIdle: () => void, timeoutMs = 10 * 60 * 1000) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onIdle, timeoutMs);
  }, [onIdle, timeoutMs]);

  useEffect(() => {
    const events = ['mousemove', 'keypress', 'touchstart', 'click', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [reset]);
}
