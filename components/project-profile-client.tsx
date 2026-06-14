"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Globe, CheckCircle, Eye, MousePointer, Bookmark, Shield,
  ExternalLink, ArrowLeft, Clock, Tag, UserPlus, AlertCircle,
  Sparkles, TrendingUp, Copy, FileText, Link2, User,
  Calendar, RefreshCw, Layers, Target, Zap, ChevronDown, ChevronUp,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllSubScoreDetails, getAllSubScores, type SubScoreDetail } from '@/lib/citability-scores';

interface ProjectProfileClientProps {
  project: any;
}

/* ── Status Badge ──────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    invited: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Invited' },
    registered: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Registered' },
    verified: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Verified' },
    submitted: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', label: 'Submitted' },
    draft: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: 'Draft' },
  };
  const c = config[status] || config.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
      {status === 'verified' && <CheckCircle className="h-3 w-3" />}
      {status === 'invited' && <Sparkles className="h-3 w-3" />}
      {c.label}
    </span>
  );
}

/* ── CH-VER-ID Generator ───────────────────────────────── */
function generateCHVerId(id: string): string {
  const hash = id.replace(/[^a-zA-Z0-9]/g, '');
  const num = parseInt(hash.slice(-6), 36) || 0;
  return `CH-VER-${String(num % 1000000).padStart(6, '0')}`;
}

/* ── Sub-Score Ring (small SVG) ─────────────────────────── */
function SubScoreRing({ detail }: { detail: SubScoreDetail }) {
  const pct = detail.score;
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={detail.color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: 56, height: 56 }}>
        <span className="text-sm font-black" style={{ color: detail.color }}>{pct}</span>
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{detail.label}</span>
    </div>
  );
}

/* ── Citability Breakdown Panel ─────────────────────────── */
function CitabilityBreakdown({ project }: { project: any }) {
  const [expanded, setExpanded] = useState(false);
  const details = useMemo(() => getAllSubScoreDetails(project), [project]);
  const scores = useMemo(() => getAllSubScores(project), [project]);
  const overallColor = scores.overall >= 70 ? '#059669' : scores.overall >= 40 ? '#D97706' : '#DC2626';

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-bold font-display text-base">Citability Score</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black" style={{ color: overallColor }}>{scores.overall}</span>
          <span className="text-xs text-muted-foreground font-mono">/100</span>
        </div>
      </div>

      {/* Sub-score rings */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto py-1">
        {details.map((d) => (
          <div key={d.label} className="relative flex flex-col items-center">
            <SubScoreRing detail={d} />
          </div>
        ))}
      </div>

      {/* Expandable detail */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition font-semibold cursor-pointer w-full justify-center"
      >
        {expanded ? 'Hide details' : 'Show scoring details'}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
          {details.map((d) => (
            <div key={d.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: d.color }}>{d.label}</span>
                <span className="text-xs font-mono text-muted-foreground">{d.score}/100</span>
              </div>
              <div className="space-y-0.5">
                {d.items.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    {item.met
                      ? <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                      : <div className="h-3 w-3 rounded-full border border-muted-foreground/30 flex-shrink-0" />}
                    <span className={item.met ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                    <span className="ml-auto text-muted-foreground/60 font-mono">+{item.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ── AI Summary Box ────────────────────────────────────── */
function AISummaryBox({ project }: { project: any }) {
  const p = project;
  if (!p?.name) return null;

  // Build structured summary from actual visible data
  const lines: { label: string; value: string }[] = [];
  lines.push({ label: 'What', value: p.summary || p.description?.slice(0, 120) || '' });
  if (p.targetAudience) lines.push({ label: 'For whom', value: p.targetAudience.split('.')[0] });
  if (p.outcome) lines.push({ label: 'Key outcome', value: p.outcome.split('.')[0] });
  if (p.category) lines.push({ label: 'Category', value: p.category.replace(/-/g, ' ') });
  if (p.founderName) lines.push({ label: 'By', value: p.founderName });
  if (p.version) lines.push({ label: 'Version', value: p.version });

  if (lines.length < 2) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/15 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold text-primary uppercase tracking-wider">AI-Extractable Summary</span>
      </div>
      <div className="space-y-1.5">
        {lines.map((line) => (
          <div key={line.label} className="flex gap-2 text-sm">
            <span className="font-semibold text-muted-foreground min-w-[85px] flex-shrink-0">{line.label}:</span>
            <span className="text-foreground">{line.value}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
        <Info className="h-3 w-3" /> Structured for AI systems to extract and cite.
      </p>
    </div>
  );
}

/* ── Trust Links Grid ──────────────────────────────────── */
function TrustLinksGrid({ project }: { project: any }) {
  const links = [
    { label: 'Website', url: project?.url, icon: Globe },
    { label: 'Demo', url: project?.demoUrl, icon: Eye },
    { label: 'Support', url: project?.supportUrl, icon: Shield },
    { label: 'Privacy', url: project?.privacyUrl, icon: FileText },
    { label: 'Terms', url: project?.termsUrl, icon: FileText },
    { label: 'Contact', url: project?.contactUrl, icon: User },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-bold font-display text-base flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" /> Links & Transparency
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 text-sm hover:border-primary/30 hover:text-primary transition"
          >
            <link.icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{link.label}</span>
            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground/50" />
          </a>
        ))}
      </div>
    </div>
  );
}

/* ── Social Links ──────────────────────────────────────── */
function SocialLinksRow({ socialLinks }: { socialLinks: any }) {
  if (!socialLinks || typeof socialLinks !== 'object') return null;
  const entries = Object.entries(socialLinks).filter(([, v]) => typeof v === 'string' && (v as string).trim());
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([platform, url]) => (
        <a
          key={platform}
          href={url as string}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary px-3 py-1.5 rounded-full text-xs font-semibold transition capitalize"
        >
          <Globe className="h-3 w-3" /> {platform}
        </a>
      ))}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────── */
export function ProjectProfileClient({ project }: ProjectProfileClientProps) {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const p = project ?? {};
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isClaimed, setIsClaimed] = useState(!p.claimable || !!p.ownerId);

  const chVerId = p?.chVerId || generateCHVerId(p?.id ?? '');
  const listedDate = p?.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const updatedDate = p?.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const year = p?.createdAt ? new Date(p.createdAt).getFullYear() : 2026;
  const profileUrl = `https://citablehub.com/p/${p?.slug ?? ''}`;
  const launchDateStr = p?.launchDate ? new Date(p.launchDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const [accessDate, setAccessDate] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    setAccessDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    if (p?.id) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'project_view', projectId: p.id }),
      }).catch(() => {});
    }
    if (p?.id) {
      fetch(`/api/projects/${p.id}/save`)
        .then(r => r.json())
        .then(d => { if (d.saved) setIsSaved(true); })
        .catch(() => {});
    }
  }, [p?.id]);

  const handleSaveToggle = async () => {
    if (!session) { toast.error('Sign in to save projects'); return; }
    setSavingToggle(true);
    try {
      const res = await fetch(`/api/projects/${p.id}/save`, { method: 'POST' });
      const data = await res.json();
      setIsSaved(data.saved);
      toast.success(data.saved ? 'Saved!' : 'Removed from saved');
    } catch { toast.error('Error saving'); }
    finally { setSavingToggle(false); }
  };

  const isVerified = p?.status === 'verified';
  const citationVerb = isVerified ? 'Verified' : 'Listed';
  const citationDate = updatedDate || listedDate;
  const indexName = isVerified ? 'CitableHub Verified Software Index' : 'CitableHub Software Index';

  const bibtex = `@misc{citablehub_${p?.slug ?? 'unknown'},
  title = {${p?.name ?? 'Unknown'}},
  url = {${profileUrl}},
  note = {${citationVerb} ${citationDate}. CitableHub ID: ${chVerId}},
  year = {${year}}
}`;

  const apaCitation = `${p?.name ?? 'Unknown'}. (${year}). ${indexName}. ${profileUrl}.${accessDate ? ` Accessed ${accessDate}.` : ''}`;
  const mlaCitation = `"${p?.name ?? 'Unknown'}." CitableHub, ${year}, ${profileUrl}.${accessDate ? ` Accessed ${accessDate}.` : ''}`;

  const handleCopyCitation = (format: string, text: string) => {
    navigator.clipboard?.writeText?.(text);
    toast.success(`${format} citation copied!`);
  };

  const handleClaim = async () => {
    if (!session) { router.push('/auth/signin'); return; }
    setClaiming(true);
    try {
      const res = await fetch('/api/projects/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: p.id }),
      });
      const data = await res.json();
      if (res.ok) { setClaimResult({ success: true, message: data.message }); setIsClaimed(true); }
      else { setClaimResult({ success: false, message: data.error }); }
    } catch { setClaimResult({ success: false, message: 'Network error. Please try again.' }); }
    finally { setClaiming(false); }
  };

  // Collect sameAs from socialLinks
  const sameAsList: string[] = [];
  if (p?.socialLinks && typeof p.socialLinks === 'object') {
    Object.values(p.socialLinks).forEach((v: any) => { if (typeof v === 'string' && v.trim()) sameAsList.push(v); });
  }

  // Build clean JSON-LD @graph — NO fake ratings, NO fake reviews
  const jsonLdGraph: any[] = [
    {
      '@type': 'BreadcrumbList',
      '@id': `${profileUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://citablehub.com' },
        { '@type': 'ListItem', position: 2, name: 'Directory', item: 'https://citablehub.com/projects' },
        { '@type': 'ListItem', position: 3, name: p?.name ?? 'Project' },
      ],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': profileUrl,
      name: p?.name ?? '',
      url: p?.url ?? '',
      identifier: chVerId,
      applicationCategory: p?.category ? p.category.replace(/-/g, ' ') : undefined,
      description: p?.description ?? '',
      abstract: p?.summary ?? '',
      datePublished: p?.createdAt ?? undefined,
      dateModified: p?.updatedAt ?? undefined,
      ...(p?.version ? { softwareVersion: p.version } : {}),
      ...(p?.launchDate ? { releaseDate: p.launchDate } : {}),
      ...(p?.demoUrl ? { installUrl: p.demoUrl } : {}),
      ...(sameAsList.length > 0 ? { sameAs: sameAsList } : {}),
      ...(p?.targetAudience ? { audience: { '@type': 'Audience', audienceType: p.targetAudience.split('.')[0] } } : {}),
      author: {
        '@type': p?.founderName ? 'Person' : 'Organization',
        name: p?.founderName || p?.name || '',
        ...(p?.url ? { url: p.url } : {}),
      },
      publisher: {
        '@type': 'Organization',
        name: 'CitableHub',
        url: 'https://citablehub.com',
        logo: { '@type': 'ImageObject', url: 'https://citablehub.com/logo.png' },
      },
      ...(p?.logoUrl ? { image: p.logoUrl } : {}),
      ...(p?.tags?.length ? { keywords: p.tags.join(', ') } : {}),
    },
    {
      '@type': 'WebPage',
      '@id': `${profileUrl}#webpage`,
      url: profileUrl,
      name: `${p?.name ?? ''} — CitableHub Profile`,
      isPartOf: { '@id': 'https://citablehub.com#website' },
      breadcrumb: { '@id': `${profileUrl}#breadcrumb` },
      about: { '@id': profileUrl },
      datePublished: p?.createdAt ?? undefined,
      dateModified: p?.updatedAt ?? undefined,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back */}
      <button onClick={() => router.push('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Back to Directory
      </button>

      {/* ═══ HERO ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-start gap-4">
          {p?.logoUrl ? (
            <img src={p.logoUrl} alt={`${p?.name || 'Project'} logo`} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-2xl text-white" style={{ backgroundColor: ['#6D28D9','#2563EB','#059669','#D97706','#DC2626','#7C3AED','#0891B2'][((p?.name||'').split('').reduce((a: number,c: string)=>a+c.charCodeAt(0),0))%7] }}>
              {(p?.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-extrabold tracking-tight font-display">{p?.name ?? 'Unknown Project'}</h1>
              <StatusBadge status={p?.status ?? 'draft'} />
            </div>
            <p className="text-muted-foreground text-sm">{p?.summary}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="capitalize bg-muted px-2 py-0.5 rounded font-mono">{p?.category?.replace(/-/g, ' ')}</span>
              {p?.subcategory && <span className="capitalize bg-muted px-2 py-0.5 rounded font-mono">{p.subcategory}</span>}
              <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{chVerId}</span>
              {p?.founderName && (
                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {p.founderName}</span>
              )}
              {listedDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {citationVerb} {citationDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CTA Row */}
        <div className="flex flex-wrap items-center gap-3">
          {p?.url && (
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) { (window as any).gtag('event', 'project_visit_click', { project_id: p?.id, project_name: p?.name, ch_ver_id: chVerId }); }
              fetch('/api/analytics/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'project_click_website', projectId: p?.id, metadata: { url: p.url } }) }).catch(() => {});
            }}>
              <Globe className="h-4 w-4" /> Visit Website <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {p?.demoUrl && (
            <a href={p.demoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-lg font-bold text-sm hover:border-primary/30 hover:text-primary transition">
              <Eye className="h-4 w-4" /> Live Demo <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <button
            onClick={handleSaveToggle}
            disabled={savingToggle}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition cursor-pointer border ${
              isSaved ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border hover:text-primary hover:border-primary/30'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-primary' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </button>
          {p?.claimable && !isClaimed && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2 rounded-lg font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition shadow-lg shadow-amber-500/25 disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              {claiming ? 'Claiming...' : 'Is this your project? Claim it'}
            </button>
          )}
        </div>

        {/* Claim Result */}
        {claimResult && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 p-3 rounded-lg text-sm font-semibold ${
              claimResult.success ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
            {claimResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {claimResult.message}
          </motion.div>
        )}
      </motion.div>

      {/* ═══ AI SUMMARY BOX ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <AISummaryBox project={p} />
      </motion.div>

      {/* ═══ CITABILITY SCORE BREAKDOWN ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <CitabilityBreakdown project={p} />
      </motion.div>

      {/* ═══ KPIs ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Impressions', value: p?.impressions ?? 0, icon: Eye },
          { label: 'Clicks', value: p?.clicks ?? 0, icon: MousePointer },
          { label: 'Saves', value: p?.savesCount ?? 0, icon: Bookmark },
          { label: 'GQI Earned', value: p?.gqiEarned ?? 0, icon: Shield },
        ].map((kpi: any, i: number) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-1">
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
            <div className="text-xl font-black font-display">{kpi?.value}</div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase">{kpi?.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ═══ CITABLE OUTCOME ═══ */}
      {p?.outcome && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-2">
          <h3 className="font-bold font-display text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Citable Outcome
          </h3>
          <p className="text-sm leading-relaxed">{p.outcome}</p>
        </motion.div>
      )}

      {/* ═══ ABOUT / DESCRIPTION ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h3 className="font-bold font-display text-lg">About</h3>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{p?.description ?? 'No description.'}</p>
        {p?.targetAudience && (
          <div className="text-sm"><strong>Target Audience:</strong> {p.targetAudience}</div>
        )}
        {p?.notIdealFor && (
          <div className="text-sm text-muted-foreground"><strong>Not ideal for:</strong> {p.notIdealFor}</div>
        )}
      </motion.div>

      {/* ═══ DIFFERENTIATORS & ALTERNATIVES ═══ */}
      {((p?.differentiators?.length > 0) || (p?.alternatives?.length > 0)) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          {p?.differentiators?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold font-display text-base flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> What makes it different</h3>
              <ul className="space-y-1">
                {p.differentiators.map((d: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> {d}</li>
                ))}
              </ul>
            </div>
          )}
          {p?.alternatives?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold font-display text-base flex items-center gap-2"><Layers className="h-4 w-4 text-muted-foreground" /> Alternatives</h3>
              <div className="flex flex-wrap gap-2">
                {p.alternatives.map((a: string, i: number) => (
                  <span key={i} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-semibold">{a}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ TAXONOMY TAGS ═══ */}
      {((p?.tags ?? []).length > 0 || (p?.useCaseTags ?? []).length > 0 || (p?.audienceTags ?? []).length > 0 || (p?.industryTags ?? []).length > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
          <h3 className="font-bold font-display text-base flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Tags & Classification</h3>
          <div className="space-y-2">
            {(p?.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {p.tags.map((tag: string, i: number) => (
                  <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">{tag}</span>
                ))}
              </div>
            )}
            {(p?.useCaseTags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {p.useCaseTags.map((tag: string, i: number) => (
                  <span key={i} className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">{tag}</span>
                ))}
              </div>
            )}
            {(p?.audienceTags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {p.audienceTags.map((tag: string, i: number) => (
                  <span key={i} className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">{tag}</span>
                ))}
              </div>
            )}
            {(p?.industryTags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {p.industryTags.map((tag: string, i: number) => (
                  <span key={i} className="bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">{tag}</span>
                ))}
              </div>
            )}
          </div>
          {(p?.platformType || p?.businessType) && (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {p.platformType && <span className="bg-muted px-2.5 py-1 rounded font-mono">Platform: {p.platformType}</span>}
              {p.businessType && <span className="bg-muted px-2.5 py-1 rounded font-mono">Model: {p.businessType}</span>}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ EVIDENCE ═══ */}
      {(p?.evidences ?? []).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-4">
          <h3 className="font-bold font-display text-lg">Supporting Evidence</h3>
          <div className="space-y-3">
            {(p?.evidences ?? []).map((ev: any) => (
              <div key={ev?.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ev?.verified ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'}`}>
                  {ev?.verified ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{ev?.title}</h4>
                  {ev?.type === 'url' && <a href={ev?.content} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{ev?.content}</a>}
                  {ev?.type === 'text' && <p className="text-xs text-muted-foreground">{ev?.content}</p>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══ TRUST LINKS ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <TrustLinksGrid project={p} />
      </motion.div>

      {/* ═══ SOCIAL LINKS ═══ */}
      {p?.socialLinks && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
          <SocialLinksRow socialLinks={p.socialLinks} />
        </motion.div>
      )}

      {/* ═══ FRESHNESS SIGNALS ═══ */}
      {(p?.version || launchDateStr || p?.lastReviewed) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {p?.version && (
            <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg">
              <RefreshCw className="h-3 w-3" /> Version {p.version}
            </span>
          )}
          {launchDateStr && (
            <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg">
              <Calendar className="h-3 w-3" /> Launched {launchDateStr}
            </span>
          )}
          {p?.lastReviewed && (
            <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg">
              <CheckCircle className="h-3 w-3" /> Reviewed {new Date(p.lastReviewed).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
            </span>
          )}
        </motion.div>
      )}

      {/* ═══ CITATION EXPORT ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="font-bold font-display text-lg">Cite this Project</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: 'BibTeX', text: bibtex },
            { label: 'APA', text: apaCitation },
            { label: 'MLA', text: mlaCitation },
          ].map((fmt) => (
            <div key={fmt.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{fmt.label}</span>
                <button onClick={() => handleCopyCitation(fmt.label, fmt.text)} className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition cursor-pointer">
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">{fmt.text}</pre>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ CLEAN JSON-LD: @graph — NO fake ratings ═══ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': jsonLdGraph,
          }),
        }}
      />
    </div>
  );
}
