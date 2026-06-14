"use client";

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, Eye, Globe, ArrowUpRight, Shield, Sparkles, Award, TrendingUp, Star, Crown, Zap, ClipboardCheck } from 'lucide-react';
import { getCompleteness } from '@/lib/completeness';
import { sortByPriority, getRankScore } from '@/lib/ranking';

interface DiscoverViewProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
  projects: any[];
  categories: any[];
  intents: any[];
  selectedCategory?: string;
  selectedIntent?: string;
}

function StatusBadge({ status, platformPartner, boostScore }: { status: string; platformPartner?: boolean; boostScore?: number }) {
  if (platformPartner) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-700">
        <Crown className="h-2.5 w-2.5" /> Launch Partner
      </span>
    );
  }
  if (boostScore && boostScore > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400">
        <Zap className="h-2.5 w-2.5" /> Boosted
      </span>
    );
  }
  const config: Record<string, { bg: string; text: string; label: string; Icon: any }> = {
    invited: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Invited', Icon: Sparkles },
    registered: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Registered', Icon: Award },
    verified: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Verified', Icon: CheckCircle },
  };
  const c = config[status];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
      <c.Icon className="h-2.5 w-2.5" /> {c.label}
    </span>
  );
}

export default function DiscoverView({ onNavigate, projects, categories, intents, selectedCategory, selectedIntent }: DiscoverViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(selectedCategory || 'all');
  const [sortBy, setSortBy] = useState<'rank' | 'trust' | 'recent'>('rank');

  const filteredProjects = useMemo(() => {
    let filtered = (projects ?? []).filter((p: any) => p?.status !== 'rejected' && p?.status !== 'flagged' && p?.status !== 'draft');
    if (activeCategory && activeCategory !== 'all') {
      filtered = filtered.filter((p: any) => p?.category === activeCategory);
    }
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p?.name?.toLowerCase()?.includes(q) ||
        p?.description?.toLowerCase()?.includes(q) ||
        p?.category?.toLowerCase()?.includes(q) ||
        (p?.tags ?? []).some((t: string) => t?.toLowerCase()?.includes(q))
      );
    }
    // Apply sorting with priority system
    switch (sortBy) {
      case 'trust':
        filtered.sort((a: any, b: any) => {
          const aP = a?.platformPartner ? 1 : 0;
          const bP = b?.platformPartner ? 1 : 0;
          if (bP !== aP) return bP - aP;
          return (b?.trustScore ?? 0) - (a?.trustScore ?? 0);
        });
        break;
      case 'recent':
        filtered.sort((a: any, b: any) => {
          const aP = a?.platformPartner ? 1 : 0;
          const bP = b?.platformPartner ? 1 : 0;
          if (bP !== aP) return bP - aP;
          return new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime();
        });
        break;
      default:
        filtered = sortByPriority(filtered);
    }
    return filtered;
  }, [projects, activeCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-8 py-4 font-sans">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight font-display flex items-center gap-2">
          <Globe className="h-7 w-7 text-primary" />
          Registry Directory
        </h1>
        <p className="text-muted-foreground text-sm">Browse citable software solutions across categories. Ranked by Relevance, Trust & Boost.</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e?.target?.value ?? '')}
              className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>
          {/* Sort */}
          <div className="flex gap-1">
            {([
              { id: 'rank' as const, label: 'Rank', icon: TrendingUp },
              { id: 'trust' as const, label: 'Trust', icon: Shield },
              { id: 'recent' as const, label: 'Recent', icon: Star },
            ]).map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  sortBy === s.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30'
                }`}
              >
                <s.icon className="h-3 w-3" />
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
              activeCategory === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30'
            }`}
          >
            All
          </button>
          {(categories ?? []).map((c: any) => (
            <button
              key={c?.id}
              onClick={() => setActiveCategory(c?.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                activeCategory === c?.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30'
              }`}
            >
              {c?.name} {c?.count > 0 && <span className="text-[10px] opacity-60">({c.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        <strong className="text-foreground">{filteredProjects.length}</strong> projects found
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(filteredProjects ?? []).map((p: any, i: number) => {
          const score = Math.round(getRankScore(p) * 100);
          return (
            <motion.div
              key={p?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              onClick={() => onNavigate(`/p/${p?.slug}`)}
              className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-sm hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                {p?.logoUrl ? (
                  <img src={p.logoUrl} alt={p?.name || ''} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-lg text-white" style={{ backgroundColor: ['#6D28D9','#2563EB','#059669','#D97706','#DC2626','#7C3AED','#0891B2'][((p?.name||'').split('').reduce((a: number,c: string)=>a+c.charCodeAt(0),0))%7] }}>
                    {(p?.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold font-display truncate group-hover:text-primary transition">{p?.name}</h3>
                    <StatusBadge status={p?.status} platformPartner={p?.platformPartner} boostScore={p?.boostScore} />
                  </div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">{p?.category}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">{p?.summary}</p>

              {/* Trust Score mini bar */}
              {p?.trustScore > 0 && (
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (p.trustScore ?? 0) >= 0.8 ? 'bg-emerald-500' : (p.trustScore ?? 0) >= 0.6 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.round(p.trustScore * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold">{Math.round(p.trustScore * 100)}%</span>
                </div>
              )}

              {/* Completeness bar for real (non-seeded) projects */}
              {!p?.isSeeded && (() => {
                const comp = getCompleteness(p);
                const pct = Math.round(comp * 100);
                if (pct >= 100) return null;
                return (
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 88 ? 'bg-emerald-500' : pct >= 63 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-blue-500">{pct}%</span>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p?.impressions ?? 0}</span>
                  <span>{p?.clicks ?? 0} clicks</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-primary font-bold">Score: {score}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {(filteredProjects ?? []).length === 0 && (
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <p className="text-lg font-bold">No projects found</p>
          <p className="text-sm">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
