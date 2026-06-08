import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';

interface PickAnnouncementProps {
  pick: {
    displayName: string;
    pickText: string;
    round: number;
    pickNumber: number;
  } | null;
  onHide?: () => void;
}

/**
 * Three-second broadcast-style banner for the most recent pick.
 *
 * Why a ref + pickNumber check: parent re-creates the `pick` object
 * on every render. Without the ref we'd re-fire the announcement
 * (and the 3s timer) on every re-render that happens during the
 * window. The ref pins the announcement to the specific pickNumber
 * so the banner shows exactly once per pick.
 */
export function PickAnnouncement({ pick, onHide }: PickAnnouncementProps) {
  const [visible, setVisible] = useState(false);
  const [currentPick, setCurrentPick] = useState(pick);
  const lastShownPickNumberRef = useRef<number | null>(null);

  useEffect(() => {
    if (pick && pick.pickNumber !== lastShownPickNumberRef.current) {
      lastShownPickNumberRef.current = pick.pickNumber;
      setCurrentPick(pick);
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onHide?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pick, onHide]);

  // Derive picker initials so the banner matches the hero card's
  // identity treatment (small circular initials chip).
  const initials = currentPick
    ? currentPick.displayName.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
    : '';

  return (
    <AnimatePresence>
      {visible && currentPick && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="mb-3 overflow-hidden"
        >
          <div
            className="relative rounded-xl px-3 py-2.5 flex items-center gap-2.5 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--gold) / 0.14), hsl(var(--gold) / 0.04))',
              border: '1px solid hsl(var(--gold) / 0.28)',
            }}
          >
            {/* Shimmer trail — a thin gold sweep that travels left→right
                once on entry, giving the banner a broadcast feel without
                being a perpetual animation. */}
            <motion.div
              aria-hidden
              initial={{ x: '-100%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="absolute inset-y-0 w-1/3 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(var(--gold) / 0.25), transparent)',
              }}
            />

            {/* Initials chip — matches the hero card avatar treatment so
                viewers visually tie the announcement to the right person. */}
            <div
              className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--gold) / 0.28), hsl(var(--gold) / 0.08))',
                color: 'hsl(var(--gold))',
                border: '1px solid hsl(var(--gold) / 0.45)',
                boxShadow: '0 0 8px hsl(var(--gold) / 0.25)',
              }}
            >
              {initials}
            </div>

            {/* Flame icon — kept from the previous design as the "pick
                made" visual marker. */}
            <motion.span
              initial={{ rotate: -90, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              className="relative z-10 flex-shrink-0"
            >
              <Flame className="w-4 h-4" style={{ color: 'hsl(var(--gold))' }} />
            </motion.span>

            <p className="relative z-10 text-[12px] font-bold flex-1 min-w-0 truncate">
              <span style={{ color: 'hsl(var(--gold))' }}>{currentPick.displayName}</span>
              <span className="text-foreground"> picks </span>
              <span className="font-extrabold text-foreground">{currentPick.pickText}</span>
            </p>
            <span className="relative z-10 text-[10px] font-mono text-muted-foreground/60 flex-shrink-0">
              Rd {currentPick.round} • #{currentPick.pickNumber}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
