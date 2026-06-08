import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnTheClockTimerProps {
  lastPickAt: string | null;
  draftStartedAt: string | null;
}

/**
 * "On the clock" timer with graduated urgency:
 *   • 0–44s   → calm  (muted grey)
 *   • 45–119s → warn  (amber)
 *   • 120s+   → urgent (red, pulsing)
 *
 * Pure visual signal — the timer doesn't enforce a hard limit and the
 * draft has no auto-skip. The escalating colour just makes the time
 * pressure feel real instead of "60s and then nothing changes ever."
 */
const WARN_AT_SEC = 45;
const URGENT_AT_SEC = 120;

export function OnTheClockTimer({ lastPickAt, draftStartedAt }: OnTheClockTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    const baseTime = lastPickAt || draftStartedAt;
    if (baseTime) {
      startRef.current = new Date(baseTime).getTime();
    } else {
      startRef.current = Date.now();
    }
    setElapsed(0);

    const interval = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastPickAt, draftStartedAt]);

  const seconds = Math.floor(elapsed / 1000);
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;

  const stage: 'calm' | 'warn' | 'urgent' =
    seconds >= URGENT_AT_SEC ? 'urgent'
    : seconds >= WARN_AT_SEC ? 'warn'
    : 'calm';

  // Token-based colours so light/dark mode contrast is correct.
  // warn  = amber 38° (lucide's default "warning" hue)
  // urgent= red 0°    (destructive)
  const colour =
    stage === 'urgent' ? 'hsl(0 75% 58%)'
    : stage === 'warn' ? 'hsl(38 95% 55%)'
    : 'hsl(var(--muted-foreground) / 0.55)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center gap-1.5 mt-2"
    >
      <Clock
        className={cn('w-3.5 h-3.5 transition-colors duration-500', stage === 'urgent' && 'animate-pulse')}
        style={{ color: colour }}
      />
      <span
        className={cn(
          'font-mono text-sm font-bold tracking-wider transition-colors duration-500 tabular-nums',
          stage === 'urgent' && 'animate-pulse',
        )}
        style={{ color: stage === 'calm' ? 'hsl(var(--muted-foreground) / 0.7)' : colour }}
      >
        {min}:{sec.toString().padStart(2, '0')}
      </span>
    </motion.div>
  );
}
