"use client";

import { useEffect, useState } from 'react';
import { Zap, TrendingUp, Eye, MousePointer, Bookmark, ExternalLink, Loader2, ShieldAlert } from 'lucide-react';
import CopyButton from '@/components/copy-button';

interface Lift { gqi: number | null; impressions: number | null; clicks: number | null; websiteClicks: number | null; saves: number | null }
interface Delivered { gqi: number; impressions: number; clicks: number; websiteClicks: number; saves: number; aiBotImpressions: number }
interface BoostResult {
  id: string;
  projectName: string;
  projectId: string | null;
  packType: string | null;
  amount: number;
  status: string;
  gqiLimit: number;
  gqiDelivered: number;
  startedAt: string | null;
  endsAt: string | null;
  daysRemaining: number | null;
  delivered: Delivered;
  lift: Lift | null;
  rankPosition: number | null;
  summary: string;
}

function LiftChip({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-mono font-bold ${positive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
      <TrendingUp className={`h-3 w-3 ${positive ? '' : 'rotate-180'}`} /> {positive ? '+' : ''}{value}% {label}
    </span>
  );
}

/** Per-boost results panel: what the builder's money delivered, measured. */
export default function BoostResults() {
  const [boosts, setBoosts] = useState<BoostResult[] | null>(null);
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/boost/results');
        if (res.status === 401) { setUnauth(true); return; }
        const data = await res.json();
        setBoosts(data?.boosts ?? []);
      } catch {
        setBoosts([]);
      }
    })();
  }, []);

  if (unauth) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold">Sign in to see your Boost results</p>
          <p className="text-muted-foreground"><a href="/auth/signin" className="text-primary hover:underline">Sign in</a> to view delivered GQI and lift.</p>
        </div>
      </div>
    );
  }

  if (boosts === null) {
    return <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading your boosts…</div>;
  }

  if (boosts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
        <Zap className="h-6 w-6 text-primary mx-auto" />
        <p className="text-sm font-semibold">No boosts yet</p>
        <p className="text-sm text-muted-foreground">A GQI Boost puts your listing in front of more users and AI engines for a fixed window — and you see exactly what it delivered here.</p>
        <a href="/boost" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition">Start a Boost <Zap className="h-4 w-4" /></a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {boosts.map((b) => {
        const pct = b.gqiLimit > 0 ? Math.min(100, Math.round((b.gqiDelivered / b.gqiLimit) * 100)) : 0;
        const active = b.status === 'active' && (b.daysRemaining ?? 0) > 0;
        return (
          <div key={b.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-bold font-display flex items-center gap-2">
                  {b.projectName}
                  <span className="text-[10px] font-mono uppercase bg-fuchsia-500/10 text-fuchsia-600 px-1.5 py-0.5 rounded">{(b.packType || 'boost')}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {active ? `Active · ${b.daysRemaining} day(s) left` : `Ended · $${b.amount}`}
                </div>
              </div>
              {b.projectId && (
                <a href={`/p/${b.projectId}`} className="text-xs text-primary hover:underline flex items-center gap-1">Profile <ExternalLink className="h-3 w-3" /></a>
              )}
            </div>

            {/* GQI progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold">GQI delivered</span>
                <span className="font-mono font-bold text-primary">{b.gqiDelivered.toLocaleString()} / {b.gqiLimit.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Lift vs baseline */}
            {b.lift && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">vs the same period before the boost</div>
                <div className="flex flex-wrap gap-2">
                  <LiftChip label="impressions" value={b.lift.impressions} />
                  <LiftChip label="clicks" value={b.lift.clicks} />
                  <LiftChip label="site visits" value={b.lift.websiteClicks} />
                  <LiftChip label="saves" value={b.lift.saves} />
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat icon={Eye} label="Impressions" value={b.delivered.impressions} />
              <Stat icon={MousePointer} label="Site visits" value={b.delivered.websiteClicks} />
              <Stat icon={Bookmark} label="Saves" value={b.delivered.saves} />
            </div>

            {/* Shareable summary */}
            <div className="flex items-center justify-between gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-xs text-foreground">{b.summary}</p>
              <CopyButton value={b.summary} label="Share" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-background border border-border rounded-xl py-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
      <div className="font-mono font-bold text-sm">{value.toLocaleString()}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
