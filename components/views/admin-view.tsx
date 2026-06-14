"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Hammer, ShieldCheck, ShieldX, Users, Eye, Layers, Download,
  Loader2, CheckCircle, XCircle, AlertCircle, Search, Bot, Activity,
  TrendingUp, BarChart3, Globe, Clock, MousePointer, Zap, Crown,
  RefreshCw, ArrowUp, ArrowDown, Flame, Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminViewProps {
  onNavigate: (path: string) => void;
}

type TabKey = 'moderation' | 'users' | 'boosts' | 'exports' | 'search' | 'botHuman' | 'ranking' | 'topQueries';

export default function AdminView({ onNavigate }: AdminViewProps) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [intel, setIntel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [intelLoading, setIntelLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('moderation');

  const isAdmin = (session?.user as any)?.role === 'admin';

  useEffect(() => {
    if (!session || !isAdmin) return;
    fetchStats();
  }, [session, isAdmin]);

  // Load intelligence data when switching to intel tabs
  useEffect(() => {
    if (['search', 'botHuman', 'ranking', 'topQueries'].includes(activeTab) && !intel && !intelLoading) {
      fetchIntelligence();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error('Admin stats error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchIntelligence = async () => {
    setIntelLoading(true);
    try {
      const res = await fetch('/api/admin/intelligence');
      if (res.ok) setIntel(await res.json());
    } catch (e) {
      console.error('Intelligence error:', e);
    } finally {
      setIntelLoading(false);
    }
  };

  const handleProjectAction = async (projectId: string, action: 'approve' | 'reject' | 'verify') => {
    try {
      const updateData: any = {};
      if (action === 'approve') updateData.status = 'approved';
      if (action === 'reject') updateData.status = 'rejected';
      if (action === 'verify') updateData.verificationStatus = 'verified';
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        toast.success(`Project ${action}d successfully`);
        fetchStats();
      }
    } catch {
      toast.error('Action failed');
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setRecalcResult(null);
    try {
      const res = await fetch('/api/admin/recalculate-rankings', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setRecalcResult(data);
        toast.success(`Rankings recalculated — ${data.totalProjects} projects scored`);
        // Refresh intelligence data
        fetchIntelligence();
      } else {
        toast.error(data.error || 'Recalculation failed');
      }
    } catch {
      toast.error('Network error during recalculation');
    } finally {
      setRecalculating(false);
    }
  };

  const handleExport = (type: string) => {
    if (!stats) return;
    let payload: any = {};
    if (type === 'projects' || type === 'all') payload.projects = stats?.projects;
    if (type === 'users' || type === 'all') payload.users = stats?.users;
    if (type === 'boosts' || type === 'all') payload.boostOrders = stats?.boostOrders;
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citablehub_export_${type}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${type} data`);
  };

  if (!session) {
    return (
      <div className="py-16 text-center space-y-4">
        <Hammer className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold font-display">Admin Access Required</h2>
        <button onClick={() => router.push('/auth/signin')} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold cursor-pointer">Sign In</button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold font-display">Access Denied</h2>
        <p className="text-muted-foreground">Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>;
  }

  const TABS: { key: TabKey; label: string; icon: any; group: 'ops' | 'intel' }[] = [
    { key: 'moderation', label: 'Moderation', icon: ShieldCheck, group: 'ops' },
    { key: 'users', label: 'Users', icon: Users, group: 'ops' },
    { key: 'boosts', label: 'Boosts', icon: Zap, group: 'ops' },
    { key: 'exports', label: 'Exports', icon: Download, group: 'ops' },
    { key: 'search', label: 'Search Intel', icon: Search, group: 'intel' },
    { key: 'botHuman', label: 'Bot vs Human', icon: Bot, group: 'intel' },
    { key: 'ranking', label: 'Ranking', icon: TrendingUp, group: 'intel' },
    { key: 'topQueries', label: 'Top Queries', icon: BarChart3, group: 'intel' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-display flex items-center gap-2">
          <Hammer className="h-7 w-7 text-primary animate-pulse" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">Directory overrides, search intelligence, and ranking activity.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Users', value: stats?.usersCount ?? 0 },
          { label: 'Projects', value: stats?.projectsCount ?? 0 },
          { label: 'Pending', value: stats?.pendingCount ?? 0 },
          { label: 'Revenue', value: `$${stats?.totalRevenue ?? 0}` },
          { label: 'GQI Delivered', value: stats?.totalGqi ?? 0 },
        ].map((kpi: any, i: number) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">{kpi?.label}</span>
            <div className="text-lg font-black font-display mt-0.5">{kpi?.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Groups */}
      <div className="space-y-1">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1 self-center">Ops</span>
          {TABS.filter(t => t.group === 'ops').map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-3 w-3" /> {tab.label}
              </button>
            );
          })}
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider ml-3 mr-1 self-center">Intel</span>
          {TABS.filter(t => t.group === 'intel').map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted border border-primary/20'
                }`}
              >
                <Icon className="h-3 w-3" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ OPS TABS ============ */}

      {activeTab === 'moderation' && (
        <div className="space-y-3">
          {(stats?.projects ?? []).map((p: any) => (
            <div key={p?.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{p?.name}</h3>
                <div className="text-xs text-muted-foreground flex gap-2">
                  <span className="capitalize bg-muted px-1.5 py-0.5 rounded">{p?.status}</span>
                  <span>{p?.category}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {p?.status === 'submitted' && (
                  <>
                    <button onClick={() => handleProjectAction(p?.id, 'approve')} className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 cursor-pointer" title="Approve"><CheckCircle className="h-4 w-4" /></button>
                    <button onClick={() => handleProjectAction(p?.id, 'reject')} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 cursor-pointer" title="Reject"><XCircle className="h-4 w-4" /></button>
                  </>
                )}
                {p?.status === 'approved' && p?.verificationStatus !== 'verified' && (
                  <button onClick={() => handleProjectAction(p?.id, 'verify')} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer" title="Verify"><ShieldCheck className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          ))}
          {(stats?.projects ?? []).length === 0 && <p className="text-muted-foreground text-center py-8">No projects to moderate.</p>}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-3">
          {(stats?.users ?? []).map((u: any) => (
            <div key={u?.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <h3 className="font-bold text-sm">{u?.displayName || u?.email}</h3>
                <span className="text-xs text-muted-foreground">{u?.email} • {u?.role} • {u?.subscription}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'boosts' && (
        <div className="space-y-3">
          {(stats?.boostOrders ?? []).length === 0 && <p className="text-muted-foreground text-center py-8">No boost orders yet.</p>}
          {(stats?.boostOrders ?? []).map((o: any) => (
            <div key={o?.id} className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold">{o?.projectName}</h3>
              <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                <span>Status: {o?.status}</span>
                <span>GQI: {o?.totalGQIRequired}</span>
                <span>${o?.paymentAmount}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'exports' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['projects', 'users', 'boosts', 'all'].map((type: string) => (
            <button
              key={type}
              onClick={() => handleExport(type)}
              className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition cursor-pointer space-y-2"
            >
              <Download className="h-6 w-6 text-primary mx-auto" />
              <span className="text-sm font-bold capitalize">{type}</span>
            </button>
          ))}
        </div>
      )}

      {/* ============ INTEL TABS ============ */}

      {intelLoading && ['search', 'botHuman', 'ranking', 'topQueries'].includes(activeTab) && (
        <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /><p className="text-xs text-muted-foreground mt-2">Loading intelligence data...</p></div>
      )}

      {/* SEARCH INTELLIGENCE */}
      {activeTab === 'search' && intel && !intelLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" /> Recent Searches
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{intel.period} • {intel.recentSearches?.length ?? 0} queries</span>
          </div>
          {(intel.recentSearches?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-center py-8">No search queries recorded yet. Data will appear as users search.</p>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-3 py-2 font-bold">Query</th>
                      <th className="text-left px-3 py-2 font-bold">Source</th>
                      <th className="text-left px-3 py-2 font-bold">Agent</th>
                      <th className="text-left px-3 py-2 font-bold">Projects Matched</th>
                      <th className="text-left px-3 py-2 font-bold">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(intel.recentSearches ?? []).map((s: any) => (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium max-w-[200px] truncate">{s.query}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${s.source === 'chat' ? 'bg-violet-500/10 text-violet-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {s.source}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${s.agentClass === 'bot' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {s.agentClass}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground max-w-[150px] truncate">{(s.projectsMatched || []).join(', ') || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{new Date(s.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOT vs HUMAN */}
      {activeTab === 'botHuman' && intel && !intelLoading && (
        <div className="space-y-4">
          <h2 className="text-base font-bold font-display flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" /> Bot vs Human Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <Globe className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-3xl font-black font-display">{intel.botHuman?.total ?? 0}</div>
              <div className="text-xs text-muted-foreground font-mono uppercase mt-1">Total Events (30d)</div>
            </div>
            <div className="bg-card border border-green-500/30 rounded-xl p-5 text-center">
              <Users className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-black font-display text-green-500">{intel.botHuman?.human ?? 0}</div>
              <div className="text-xs text-muted-foreground font-mono uppercase mt-1">Human ({intel.botHuman?.humanPct ?? 0}%)</div>
            </div>
            <div className="bg-card border border-red-500/30 rounded-xl p-5 text-center">
              <Bot className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <div className="text-3xl font-black font-display text-red-500">{intel.botHuman?.bot ?? 0}</div>
              <div className="text-xs text-muted-foreground font-mono uppercase mt-1">Bot ({intel.botHuman?.botPct ?? 0}%)</div>
            </div>
          </div>
          {/* Visual bar */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-muted-foreground">Distribution</div>
            <div className="h-6 rounded-full overflow-hidden flex bg-muted">
              {(intel.botHuman?.humanPct ?? 0) > 0 && (
                <div className="bg-green-500 h-full flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${intel.botHuman?.humanPct}%` }}>
                  {intel.botHuman?.humanPct}% Human
                </div>
              )}
              {(intel.botHuman?.botPct ?? 0) > 0 && (
                <div className="bg-red-500 h-full flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${intel.botHuman?.botPct}%` }}>
                  {intel.botHuman?.botPct}% Bot
                </div>
              )}
            </div>
          </div>
          {/* Event type breakdown */}
          {(intel.eventBreakdown?.length ?? 0) > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-muted-foreground">Event Types</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(intel.eventBreakdown ?? []).map((e: any) => (
                  <div key={e.type} className="bg-muted/30 rounded-lg px-3 py-2">
                    <div className="text-xs font-mono font-bold truncate">{e.type}</div>
                    <div className="text-lg font-black font-display">{e.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RANKING ACTIVITY */}
      {activeTab === 'ranking' && intel && !intelLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Ranking Activity
            </h2>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalculating...' : 'Recalculate Rankings'}
            </button>
          </div>

          {/* Recalculation result */}
          {recalcResult && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle className="h-4 w-4" /> Rankings Updated
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-card rounded-lg p-2 text-center">
                  <div className="font-black text-lg">{recalcResult.totalProjects}</div>
                  <div className="text-muted-foreground">Projects Scored</div>
                </div>
                <div className="bg-card rounded-lg p-2 text-center">
                  <div className="font-black text-lg">{recalcResult.totalEvents}</div>
                  <div className="text-muted-foreground">Events (30d)</div>
                </div>
                <div className="bg-card rounded-lg p-2 text-center">
                  <div className="font-black text-lg">{recalcResult.decayDays}d</div>
                  <div className="text-muted-foreground">Decay Window</div>
                </div>
              </div>
              {/* Top movers */}
              {recalcResult.topMovers?.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-muted-foreground">Top Movers</h4>
                  {recalcResult.topMovers.slice(0, 10).map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-card rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold w-5">#{m.newRank}</span>
                        <span className="font-semibold truncate max-w-[140px]">{m.name}</span>
                        {m.platformPartner && <Crown className="h-3 w-3 text-violet-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{m.score.toFixed(1)}pts</span>
                        {m.movement > 0 ? (
                          <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                            <ArrowUp className="h-3 w-3" /> +{m.movement}
                          </span>
                        ) : m.movement < 0 ? (
                          <span className="text-red-500 font-bold flex items-center gap-0.5">
                            <ArrowDown className="h-3 w-3" /> {m.movement}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-3 py-2 font-bold">#</th>
                    <th className="text-left px-3 py-2 font-bold">Project</th>
                    <th className="text-center px-3 py-2 font-bold">Trust</th>
                    <th className="text-center px-3 py-2 font-bold">Boost</th>
                    <th className="text-center px-3 py-2 font-bold">Views</th>
                    <th className="text-center px-3 py-2 font-bold">Clicks</th>
                    <th className="text-center px-3 py-2 font-bold">Saves</th>
                    <th className="text-center px-3 py-2 font-bold">DynScore</th>
                    <th className="text-center px-3 py-2 font-bold">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(intel.rankingActivity ?? []).map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono font-bold text-muted-foreground">{p.rank}</td>
                      <td className="px-3 py-2">
                        <div className="font-semibold truncate max-w-[180px]">{p.name}</div>
                        <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${p.status === 'verified' ? 'bg-green-500/10 text-green-500' : p.status === 'approved' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
                      </td>
                      <td className="px-3 py-2 text-center font-mono">{p.trustScore}%</td>
                      <td className="px-3 py-2 text-center font-mono">{p.boostScore}</td>
                      <td className="px-3 py-2 text-center font-mono">{p.impressions + (p.events?.views || 0)}</td>
                      <td className="px-3 py-2 text-center font-mono">{p.clicks + (p.events?.clicks || 0)}</td>
                      <td className="px-3 py-2 text-center font-mono">{p.savesCount || 0}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-primary">{(p.dynamicScore ?? 0).toFixed(1)}</td>
                      <td className="px-3 py-2 text-center">
                        {p.platformPartner ? (
                          <span className="text-[10px] bg-violet-500/10 text-violet-500 px-1.5 py-0.5 rounded font-bold">Partner</span>
                        ) : p.isSeeded ? (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold">Seeded</span>
                        ) : (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">Real</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TOP QUERIES */}
      {activeTab === 'topQueries' && intel && !intelLoading && (
        <div className="space-y-4">
          <h2 className="text-base font-bold font-display flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Top Queries (30d)
          </h2>
          {(intel.topQueries?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-center py-8">No search queries recorded yet. Data will appear as users search.</p>
          ) : (
            <div className="space-y-2">
              {(intel.topQueries ?? []).map((q: any, i: number) => {
                const maxCount = intel.topQueries?.[0]?.count || 1;
                const barWidth = Math.max(8, Math.round((q.count / maxCount) * 100));
                return (
                  <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-mono font-bold text-muted-foreground w-6">#{i + 1}</span>
                        <span className="font-semibold text-sm truncate">{q.query}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(q.sources || []).map((s: string) => (
                          <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${s === 'chat' ? 'bg-violet-500/10 text-violet-500' : 'bg-blue-500/10 text-blue-500'}`}>{s}</span>
                        ))}
                        <span className="text-sm font-black font-display">{q.count}×</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                    </div>
                    {(q.projectsShown?.length ?? 0) > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        Projects shown: {q.projectsShown.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}