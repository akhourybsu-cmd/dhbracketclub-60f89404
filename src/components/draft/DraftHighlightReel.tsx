// DH Club — Draft Arena · Auto-narrated highlight reel
//
// A three-line "sports column" intro shown above the podium on the
// results screen. Built entirely from the same numbers DraftStatsCard
// already shows — no extra AI calls, no new data dependencies. Just
// reshapes them into a story so the report opens with personality
// instead of a wall of metrics.
//
// Lines pick themselves greedily from the data that exists:
//   1. Winner — always present if there's a #1 result
//   2. Highlight — biggest steal (preferred) else MVP if no steal
//   3. Timing — slowest deliberation OR fastest pick, whichever reads better
//
// If a category has no data (single-pick draft, no timings), the line
// is silently skipped — the component returns null if no lines survive.

import { motion } from 'framer-motion';
import { Trophy, Sparkles, Clock } from 'lucide-react';
import type { DraftResult } from '@/hooks/useDraftResults';
import {
  computePickTimings,
  formatDuration,
  findMvpPick,
  findBiggestSteal,
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

interface Props {
  picks: Pick[];
  results: DraftResult[];
  participants: Participant[];
}

interface Line {
  icon: typeof Trophy;
  accent: string;
  text: React.ReactNode;
}

export function DraftHighlightReel({ picks, results, participants }: Props) {
  if (results.length === 0) return null;

  const lines: Line[] = [];

  // Line 1 — winner. Always tries first.
  const winner = results.find(r => r.rank === 1);
  if (winner) {
    const name = getDisplayName(winner.user_id, participants);
    lines.push({
      icon: Trophy,
      accent: 'hsl(var(--gold))',
      text: (
        <>
          <strong className="font-extrabold" style={{ color: 'hsl(var(--gold))' }}>{name}</strong>
          {' topped the board with '}
          <span className="font-extrabold tabular-nums">{Number(winner.total_score).toFixed(1)}</span>
          {' points.'}
        </>
      ),
    });
  }

  // Line 2 — biggest steal (preferred for narrative punch) else MVP.
  const steal = findBiggestSteal(results, picks);
  const mvp = findMvpPick(results);
  if (steal) {
    lines.push({
      icon: Sparkles,
      accent: 'hsl(152 72% 46%)',
      text: (
        <>
          {'The biggest steal: '}
          <strong className="font-extrabold">{steal.pickText}</strong>
          {' in round '}
          <span className="font-extrabold tabular-nums">{steal.round}</span>
          {' ('}
          <span className="font-bold tabular-nums">{steal.score.toFixed(1)}</span>
          {' from '}
          <span className="font-bold">{getDisplayName(steal.userId, participants)}</span>
          {').'}
        </>
      ),
    });
  } else if (mvp) {
    lines.push({
      icon: Sparkles,
      accent: 'hsl(152 72% 46%)',
      text: (
        <>
          {'MVP pick: '}
          <strong className="font-extrabold">{mvp.pickText}</strong>
          {' at '}
          <span className="font-extrabold tabular-nums">{mvp.score.toFixed(1)}</span>
          {' — '}
          <span className="font-bold">{getDisplayName(mvp.userId, participants)}</span>
          {'.'}
        </>
      ),
    });
  }

  // Line 3 — timing colour. Prefer the slowest deliberation (more
  // entertaining) if it's >2x the fastest, otherwise show fastest.
  const timings = computePickTimings(picks);
  if (timings) {
    const useSlow = timings.slowest.deltaMs >= timings.fastest.deltaMs * 2.5;
    if (useSlow) {
      lines.push({
        icon: Clock,
        accent: 'hsl(38 95% 55%)',
        text: (
          <>
            {'Longest deliberation: '}
            <strong className="font-extrabold">{timings.slowest.pickText}</strong>
            {' at '}
            <span className="font-extrabold tabular-nums">{formatDuration(timings.slowest.deltaMs)}</span>
            {'.'}
          </>
        ),
      });
    } else {
      lines.push({
        icon: Clock,
        accent: 'hsl(195 80% 55%)',
        text: (
          <>
            {'Fastest pick: '}
            <strong className="font-extrabold">{timings.fastest.pickText}</strong>
            {' in '}
            <span className="font-extrabold tabular-nums">{formatDuration(timings.fastest.deltaMs)}</span>
            {'.'}
          </>
        ),
      });
    }
  }

  if (lines.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm px-4 py-3 mb-4"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground/70">
          Highlight Reel
        </span>
      </div>
      <ul className="space-y-1.5">
        {lines.map((line, i) => {
          const Icon = line.icon;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * (i + 1), duration: 0.25 }}
              className="flex items-start gap-2 text-[12.5px] leading-snug text-foreground/85"
            >
              <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: line.accent }} />
              <span className="min-w-0">{line.text}</span>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
