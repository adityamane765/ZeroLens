'use client';
import { useEffect, useState } from 'react';

export function TimeLockCountdown({ expiryMs }: { expiryMs: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, expiryMs - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, expiryMs - Date.now()));
    }, 500);
    return () => clearInterval(interval);
  }, [expiryMs]);

  const seconds = Math.ceil(remaining / 1000);
  const expired = seconds <= 0;

  if (expired) {
    return (
      <span className="text-xs font-mono font-semibold animate-pulse" style={{ color: '#4ade80' }}>
        ✓ unlocked — ready to reveal
      </span>
    );
  }

  const pct = Math.min(100, (remaining / 30000) * 100);
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-mono" style={{ color: '#fbbf24' }}>{seconds}s until unlock</span>
      <div className="w-full rounded-full h-px" style={{ background: '#1e1730' }}>
        <div
          className="h-px rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}
        />
      </div>
    </div>
  );
}
