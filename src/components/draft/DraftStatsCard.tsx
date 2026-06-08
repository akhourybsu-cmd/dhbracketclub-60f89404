// DH Club — Draft Arena · Stats card
//
// Presents the post-draft analytics as a grid of icon chips. Each chip
// has an accent colour, an icon, a small uppercase label, and a value.
// Mobile is a 2-column grid; sm+ goes to 3 columns. The card is
// open-by-default on desktop and collapsible on mobile so phone users
// can keep the report dense without losing access to the detail.
//
// All numbers come from src/lib/draftStats.ts — this file is
// presentation only, no data work.

import { motion } from 'framer-motion';
import { Timer, Zap, Target, TrendingUp, Clock, Award, Flame, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { DraftResult } from '@/hooks/useDraftResults';
import {
  computePickTimings,
  formatDuration,
  findMvpPick,
  findBiggestSteal,
  findMostConsistent,
  findScoringStreaks,
  getDisplayName,
} from '@/lib/draftStats';

interface Pick {
  id: string;
  user_id: string;
  pick_text: string;
  pick_number: number;
  round: number;
  picked_at?: string;
  profiles?: { display_name: string };
}

interface Participant {
  user_id: string;
  profiles?: { display_name: string };
}

interface DraftStatsCardProps {
  picks: Pick[];
  results: DraftResult[];
  participants: Participant[];
}

interface Chip {
  icon: typeof Timer;
  accent: string;       // hsl triple string e.g. "45 93% 52%"
  label: string;
  headline: string;     // the big value (1-2 short words / a number)
  sub?: string;         // optional secondary line
}

export function DraftStatsCard({ picks, results, participants }: DraftStatsCardProps) {
  // Default open on desktop, closed on mobile. Reads window width once
  // on mount — no resize listener since this is a glance-and-go view.
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 640px)').matches;
  });

  // If the user resizes (rare on phones, common on dev) re-sync the
  // default state to the new breakpoint, but only if they haven't
  // toggled the panel themselves yet.
  const [userToggled, setUserToggled] = useState(false);
  useEffect(() => {
    if (userToggled) return;
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setOpen(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [userToggled]);

  const timings = computePickTimings(picks);
  const mvpPick = findMvpPick(results);
  const biggestSteal = findBiggestSteal(results, picks);
  const mostConsistent = findMostConsistent(results);
  const streaks = findScoringStreaks(results, picks);

  const chips: Chip[] = [];

  if (mvpPick) {
    chips.push({
      icon: Award,
      accent: 'var(--gold)',
      label: 'MVP Pick',
      headline: mvpPick.pickText,
      sub: `${mvpPick.score.toFixed(1)} · ${getDisplayName(mvpPick.userId, participants)}`,
    });
  }
  if (biggestSteal) {
    chips.push({
      icon: TrendingUp,
      accent: '152 72% 46%',
      label: 'Biggest Steal',
      headline: biggestSteal.pickText,
      sub: `${biggestSteal.score.toFixed(1)} · Round ${biggestSteal.round}`,
    });
  }
  if (timings) {
    chips.push({
      icon: Zap,
      accent: '195 80% 55%',
      label: 'Fastest Pick',
      headline: formatDuration(timings.fastest.deltaMs),
      sub: timings.fastest.pickText,
    });
    chips.push({
      icon: Timer,
      accent: '38 95% 55%',
      label: 'Longest Wait',
      headline: formatDuration(timings.slowest.deltaMs),
      sub: timings.slowest.pickText,
    });
  }
  if (mostConsistent) {
    chips.push({
      icon: Target,
      accent: '270 70% 60%',
      label: 'Most Consistent',
      headline: getDisplayName(mostConsistent.userId, participants),
      sub: `σ ${mostConsistent.stdDev.toFixed(2)}`,
    });
  }
  if (streaks.size > 0) {
    const best = [...streaks.entries()].sort((a, b) => b[1] - a[1])[0];
    chips.push({
      icon: Flame,
      accent: 'var(--gold)',
      label: 'Hot Streak',
      headline: `${best[1]} picks`,
      sub: `${getDisplayName(best[0], participants)} (7.5+)`,
    });
  }
  if (timings?.totalDurationMs) {
    chips.push({
      icon: Clock,
      accent: '0 0% 60%',
      label: 'Total Time',
      headline: formatDuration(timings.totalDurationMs),
    });
  }

  if (chips.length === 0) return null;

  return (
    <Collapsible
      open={open}
      onOpenChange={(v) => { setUserToggled(true); setOpen(v); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden mb-4"
      >
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center gap-2 text-left">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/60 flex-1">
            Draft Stats
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mr-1.5 tabular-nums">
            {chips.length}
          </span>
          <ChevronDown
            className={cn('w-4 h-4 text-muted-foreground/60 transition-transform duration-200', open && 'rotate-180')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-3 pb-3 pt-1">
            {chips.map((chip, i) => {
              const Icon = chip.icon;
              const hsl = chip.accent.startsWith('var(') ? `hsl(${chip.accent})` : `hsl(${chip.accent})`;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.2 }}
                  className="rounded-xl px-3 py-2.5 min-w-0"
                  style={{
                    background: `linear-gradient(180deg, ${hsl.replace(')', ' / 0.08)')}, hsl(var(--card)))`,
                    border: `1px solid ${hsl.replace(')', ' / 0.28)')}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 flex-shrink-0" style={{ color: hsl }} />
                    <p
                      className="text-[8.5px] font-extrabold uppercase tracking-[0.18em] truncate"
                      style={{ color: hsl }}
                    >
                      {chip.label}
                    </p>
                  </div>
                  <p className="text-[12px] font-extrabold leading-tight truncate" title={chip.headline}>
                    {chip.headline}
                  </p>
                  {chip.sub && (
                    <p className="text-[10px] text-muted-foreground/70 font-bold mt-0.5 truncate" title={chip.sub}>
                      {chip.sub}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
}
