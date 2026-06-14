"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, TrendingUp, Star, Sparkles, CheckCircle,
  Shield, Zap, Crown, Award, BarChart3
} from 'lucide-react';
import { sortByPriority, getRankScore } from '@/lib/ranking';

interface FloatingSidebarProps {
  projects: any[];
  onNavigate: (path: string) => void;
}

type SortMode = 'trending' | 'trust' | 'boost';

function StatusIcon({ status, platformPartner }: { status: string; platformPartner?: boolean }) {
  if (platformPartner) return <Crown className="h-3 w-3 text-violet-500" />;
  switch (status) {
    case 'verified': return <CheckCircle className="h-3 w-3 text-emerald-500" />;
    case 'registered': return <Award className="h-3 w-3 text-blue-500" />;
    case 'invited': return <Sparkles className="h-3 w-3 text-amber-500" />;
    default: return null;
  }
}

export default function FloatingSidebar({ projects, onNavigate }: FloatingSidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('trending');

  const rankedProjects = useMemo(() => {
    const valid = (projects ?? []).filter((p: any) => p?.status !== 'rejected' && p?.status !== 'flagged' && p?.status !== 'draft');
    let sorted: any[];
    switch (sortMode) {
      case 'trust':
        sorted = [...valid].sort((a, b) => {
          const aP = a?.platformPartner ? 1 : 0;
          const bP = b?.platformPartner ? 1 : 0;
          if (bP !== aP) return bP - aP;
          return (b?.trustScore ?? 0) - (a?.trustScore ?? 0);
        });
        break;
      case 'boost':
        sorted = [...valid].sort((a, b) => {
          const aP = a?.platformPartner ? 1 : 0;
          const bP = b?.platformPartner ? 1 : 0;
          if (bP !== aP) return bP - aP;
          return (b?.boostScore ?? 0) - (a?.boostScore ?? 0);
        });
        break;
      default:
        sorted = sortByPriority(valid);
    }
    return sorted.slice(0, 15);
  }, [projects, sortMode]);

  return (
    <>
      {/* Collapsed state — icon strip */}
      <motion.div
        initial={{ x: -80 }}
        animate={{ x: expanded ? -80 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1 bg-card/95 backdrop-blur-sm border border-border border-l-0 rounded-r-xl py-3 px-1.5 shadow-lg"
      >
        <button
          onClick={() => setExpanded(true)}
          className="p-2 hover:bg-primary/10 rounded-lg transition cursor-pointer group"
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
        </button>
        <div className="w-6 h-px bg-border my-1" />
        {rankedProjects.slice(0, 5).map((p: any, i: number) => (
          <button
            key={p?.id || i}
            onClick={() => onNavigate(`/p/${p?.slug}`)}
            className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 transition cursor-pointer group relative"
            title={p?.name}
          >
            <span className="text-primary font-bold text-xs">{p?.name?.charAt?.(0) ?? '?'}</span>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary text-primary-foreground rounded-full text-[8px] font-bold flex items-center justify-center">
              {i + 1}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Expanded state — full panel */}
      <AnimatePresence>
        {expanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[300px] bg-card/98 backdrop-blur-md border-r border-border shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="font-bold font-display text-sm">Top Projects</span>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1.5 hover:bg-muted rounded-lg transition cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              {/* Sort Tabs */}
              <div className="flex gap-1 px-3 py-2 border-b border-border">
                {([
                  { id: 'trending' as SortMode, label: 'Trending', icon: TrendingUp },
                  { id: 'trust' as SortMode, label: 'Trust', icon: Shield },
                  { id: 'boost' as SortMode, label: 'Boosted', icon: Zap },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSortMode(tab.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      sortMode === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Project List */}
              <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                {rankedProjects.map((p: any, i: number) => {
                  const score = sortMode === 'trust' ? p?.trustScore : sortMode === 'boost' ? p?.boostScore : getRankScore(p);
                  const pct = Math.round((score ?? 0) * 100);

                  return (
                    <button
                      key={p?.id || i}
                      onClick={() => {
                        onNavigate(`/p/${p?.slug}`);
                        setExpanded(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-muted/80 transition cursor-pointer group text-left"
                    >
                      {/* Rank */}
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                        i < 3 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {i + 1}
                      </span>

                      {/* Avatar */}
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-xs">{p?.name?.charAt?.(0) ?? '?'}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs truncate group-hover:text-primary transition">{p?.name}</span>
                          <StatusIcon status={p?.status} platformPartner={p?.platformPartner} />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="font-mono">{p?.category}</span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className={`text-[10px] font-black ${
                          pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-blue-500' : 'text-amber-500'
                        }`}>
                          {pct}%
                        </span>
                        {i < 3 && <Crown className="h-3 w-3 text-amber-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-4 py-3">
                <a
                  href="/projects"
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold py-2 rounded-lg transition cursor-pointer block text-center"
                >
                  Browse All Projects →
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
