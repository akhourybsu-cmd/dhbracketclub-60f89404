import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, ChevronRight, Archive, Sparkles, Calendar, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAllSeasons, useProfilesByIds, type DraftSeason } from '@/hooks/useDraftSeasons';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_PRESET: Record<string, { label: string; cls: string; live: boolean }> = {
  upcoming: { label: 'Upcoming', cls: 'da-status-setup', live: false },
  regular_season: { label: 'Active', cls: 'da-status-active', live: true },
  playoffs: { label: 'Playoffs Live', cls: 'da-status-active', live: true },
  complete: { label: 'Complete', cls: 'da-status-complete', live: false },
};

export default function SeasonsArchivePage() {
  const { seasons, loading } = useAllSeasons();
  const [query, setQuery] = useState('');

  const championIds = seasons.map(s => s.champion_user_id ?? null);
  const profileMap = useProfilesByIds(championIds);

  // Filter by season name OR champion display name. Case-insensitive,
  // trimmed. Empty query passes everything through.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return seasons;
    return seasons.filter(s => {
      if (s.name.toLowerCase().includes(q)) return true;
      const champ = s.champion_user_id ? profileMap.get(s.champion_user_id) : null;
      if (champ?.display_name.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [seasons, query, profileMap]);

  const active = filtered.filter(s => s.status === 'regular_season' || s.status === 'playoffs');
  const upcoming = filtered.filter(s => s.status === 'upcoming');
  const archived = filtered.filter(s => s.status === 'complete');

  // Group the archive by year-of-ends_at so older seasons get scannable
  // section headers (## 2026 / ## 2025 / ...). Newest year first.
  const archivedByYear = useMemo(() => {
    const map = new Map<number, DraftSeason[]>();
    for (const s of archived) {
      const year = new Date(s.ends_at).getFullYear();
      const list = map.get(year) ?? [];
      list.push(s);
      map.set(year, list);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [archived]);

  const hasAnyResult = active.length > 0 || upcoming.length > 0 || archived.length > 0;

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Link to="/drafts" className="da-back" aria-label="Back to Drafts">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="page-header mb-0 flex-1">
          <div className="da-page-icon">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="page-header-title">Seasons</h1>
            <p className="page-header-subtitle">Trophy room & archive</p>
          </div>
        </div>
      </div>

      {/* Search — filters by season name OR champion name. Only shown
          once there's more than a couple seasons to search through. */}
      {!loading && seasons.length > 2 && (
        <div className="relative mb-4">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search seasons or champions…"
            className="form-input pl-9 pr-9 h-10 text-[13px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground active:bg-muted/40"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="da-glass p-5">
              <div className="h-4 rounded-lg w-1/3 mb-2.5 da-shimmer" />
              <div className="h-3 rounded-lg w-1/2 da-shimmer" />
            </div>
          ))}
        </div>
      ) : seasons.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="empty-state">
          <div className="da-page-icon" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem' }}>
            <Trophy className="w-7 h-7" />
          </div>
          <p className="empty-state-title">No seasons yet</p>
          <p className="empty-state-desc">Once a season runs, it'll appear here.</p>
        </motion.div>
      ) : !hasAnyResult ? (
        // Search returned nothing — show a small inline empty state
        // instead of the no-seasons hero card. Lets the user clear the
        // search and try again without losing the page header.
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/30 bg-card/50 px-4 py-6 text-center"
        >
          <p className="text-[13px] font-extrabold">No matches</p>
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            Nothing matched "{query}". Try a season name or champion.
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-3 h-9 px-3 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1.5"
            style={{ background: 'hsl(var(--primary) / 0.18)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.4)' }}
          >
            Clear search
          </button>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {(active.length > 0 || upcoming.length > 0) && (
            <Section title="Active" icon={<Sparkles className="w-3.5 h-3.5" style={{ color: 'hsl(var(--gold))' }} />}>
              {[...active, ...upcoming].map((s, i) => (
                <SeasonCard key={s.id} season={s} index={i} profileMap={profileMap} />
              ))}
            </Section>
          )}

          {archivedByYear.length > 0 && (
            <Section title="Archive" icon={<Archive className="w-3.5 h-3.5 text-muted-foreground/70" />}>
              {/* Year sub-headers when there's more than one year present.
                  A single year of archived seasons doesn't need the chrome. */}
              {archivedByYear.length === 1 ? (
                archivedByYear[0][1].map((s, i) => (
                  <SeasonCard key={s.id} season={s} index={i} profileMap={profileMap} archived />
                ))
              ) : (
                archivedByYear.map(([year, list], groupIdx) => (
                  <div key={year} className={cn('space-y-2', groupIdx > 0 && 'pt-2')}>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground/55 pl-1">
                      {year}
                      <span className="ml-1.5 text-muted-foreground/40 font-bold normal-case tracking-normal">
                        · {list.length} {list.length === 1 ? 'season' : 'seasons'}
                      </span>
                    </p>
                    {list.map((s, i) => (
                      <SeasonCard key={s.id} season={s} index={i} profileMap={profileMap} archived />
                    ))}
                  </div>
                ))
              )}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        {icon}
        <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SeasonCard({
  season,
  index,
  profileMap,
  archived = false,
}: {
  season: DraftSeason;
  index: number;
  profileMap: Map<string, { display_name: string; avatar_url: string | null }>;
  archived?: boolean;
}) {
  const st = STATUS_PRESET[season.status] || STATUS_PRESET.upcoming;
  const champion = season.champion_user_id ? profileMap.get(season.champion_user_id) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 + index * 0.04 }}
    >
      <Link to={`/drafts/seasons/${season.id}`} className="block group">
        <div
          className={cn(
            'da-glass p-4 hover-lift cursor-pointer relative overflow-hidden',
            !archived && 'border-gold/30'
          )}
          style={
            !archived
              ? {
                  background:
                    'linear-gradient(135deg, hsl(var(--gold) / 0.08), transparent 60%), linear-gradient(180deg, hsl(160 35% 7% / 0.88), hsl(160 50% 4% / 0.94))',
                  borderLeft: '3px solid hsl(var(--gold))',
                }
              : { borderLeft: '3px solid hsl(var(--silver) / 0.45)' }
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-extrabold text-[14px] truncate">{season.name}</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 font-medium">
                <Calendar className="w-2.5 h-2.5" />
                <span>
                  {format(new Date(season.starts_at), 'MMM yyyy')} —{' '}
                  {format(new Date(season.ends_at), 'MMM yyyy')}
                </span>
              </div>
              {champion && archived && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Trophy className="w-3 h-3" style={{ color: 'hsl(var(--gold))' }} />
                  <span className="text-[11px] font-bold" style={{ color: 'hsl(var(--gold))' }}>
                    {champion.display_name}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60 font-medium">champion</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={cn('flex items-center gap-1', st.cls)}>
                {st.live && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                {st.label}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-all" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
