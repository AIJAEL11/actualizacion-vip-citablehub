"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Megaphone, Copy, Check, ExternalLink, ChevronDown, ChevronUp,
  Sparkles, Target, Zap, Link2, FileText, Hash, Quote,
  CheckCircle2, Circle, Clock, ArrowUpRight, Rocket, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { DESTINATIONS, getRecommendedDestinations, type Destination } from '@/lib/destinations';
import {
  generateOneLiner, generateShort, generateFull, generateHashtags,
  generateUTMLink, generateAPACitation, generateBibTeX, generateMLACitation,
  generateSubmissionPack, getCitabilityScore, getMissingFieldSuggestions,
} from '@/lib/copy-generator';

type DestStatus = 'not_started' | 'submitted' | 'approved';

interface PromotionViewProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
  projects: any[];
  pageParams?: Record<string, any>;
}

const STATUS_LABELS: Record<DestStatus, { label: string; color: string; icon: any }> = {
  not_started: { label: 'Not Started', color: 'text-muted-foreground', icon: Circle },
  submitted: { label: 'Submitted', color: 'text-amber-500', icon: Clock },
  approved: { label: 'Approved', color: 'text-green-500', icon: CheckCircle2 },
};

const STATUS_CYCLE: DestStatus[] = ['not_started', 'submitted', 'approved'];

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success(label ? `${label} copied` : 'Copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="p-1.5 rounded-md hover:bg-muted transition cursor-pointer flex-shrink-0" title="Copy">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';
  return (
    <svg width="90" height="90" className="flex-shrink-0">
      <circle cx="45" cy="45" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 45 45)" className="transition-all duration-700" />
      <text x="45" y="42" textAnchor="middle" className="fill-foreground text-xl font-black">{score}</text>
      <text x="45" y="56" textAnchor="middle" className="fill-muted-foreground text-[8px] font-bold">/100</text>
    </svg>
  );
}

export default function PromotionView({ onNavigate, projects, pageParams }: PromotionViewProps) {
  const { data: session } = useSession() || {};
  const userId = (session?.user as any)?.id;

  // Get user's projects
  const myProjects = useMemo(() => (projects ?? []).filter((p: any) => p?.ownerId === userId), [projects, userId]);

  // Selected project
  const [selectedId, setSelectedId] = useState<string | null>(pageParams?.projectId || null);
  const project = useMemo(() => myProjects.find((p: any) => p?.id === selectedId) || myProjects[0] || null, [myProjects, selectedId]);

  useEffect(() => {
    if (!selectedId && myProjects.length > 0) setSelectedId(myProjects[0]?.id);
  }, [myProjects, selectedId]);

  // Destination statuses from localStorage
  const [destStatuses, setDestStatuses] = useState<Record<string, DestStatus>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ checklist: true, copypack: true });
  const [utmSource, setUtmSource] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('launch');

  // Load destination statuses
  useEffect(() => {
    if (!project?.id) return;
    try {
      const stored = localStorage.getItem(`citablehub_promo_${project.id}`);
      if (stored) setDestStatuses(JSON.parse(stored));
      else setDestStatuses({});
    } catch { setDestStatuses({}); }
  }, [project?.id]);

  // Save destination statuses
  const setStatus = useCallback((destId: string, status: DestStatus) => {
    if (!project?.id) return;
    setDestStatuses(prev => {
      const updated = { ...prev, [destId]: status };
      localStorage.setItem(`citablehub_promo_${project.id}`, JSON.stringify(updated));
      return updated;
    });
    // Track
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'promotion_status_change', projectId: project.id, metadata: { destId, status } }),
    }).catch(() => {});
  }, [project?.id]);

  const cycleStatus = (destId: string) => {
    const current = destStatuses[destId] || 'not_started';
    const idx = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    setStatus(destId, next);
  };

  const trackCopy = (field: string) => {
    if (!project?.id) return;
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'promotion_copy_text', projectId: project.id, metadata: { field } }),
    }).catch(() => {});
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Computed values
  const score = project ? getCitabilityScore(project) : 0;
  const missingFields = project ? getMissingFieldSuggestions(project) : [];
  const destinations = project ? getRecommendedDestinations(project.categoryId || project.category || '', project.tags || [], 10) : [];
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://citablehub.com';
  const profileUrl = project ? `${siteUrl}/p/${project.slug || project.id}` : '';

  const submittedCount = destinations.filter(d => ['submitted', 'approved'].includes(destStatuses[d.id] || '')).length;
  const approvedCount = destinations.filter(d => destStatuses[d.id] === 'approved').length;

  if (!session) {
    return (
      <div className="py-16 text-center space-y-4">
        <Megaphone className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold font-display">Sign in to access your Promotion Center</h2>
        <button onClick={() => onNavigate('/dashboard')} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold cursor-pointer hover:bg-primary/90 transition">Sign In</button>
      </div>
    );
  }

  if (myProjects.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <Rocket className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold font-display">No projects yet</h2>
        <p className="text-muted-foreground">Submit a project first to unlock your Promotion Center.</p>
        <button onClick={() => onNavigate('/submit')} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold cursor-pointer hover:bg-primary/90 transition">Submit Project</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" />
            Promotion Center
          </h1>
          <p className="text-muted-foreground text-sm">Distribute, track, and maximize your project&apos;s visibility.</p>
        </div>

        {/* Project Selector */}
        {myProjects.length > 1 && (
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm font-medium cursor-pointer outline-none focus:ring-2 focus:ring-primary/30 max-w-[240px]"
          >
            {myProjects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Score + Stats Bar */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
        <ScoreRing score={score} />
        <div className="flex-1 space-y-2">
          <h2 className="text-lg font-bold font-display">{project?.name}</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-muted/50 rounded-lg px-3 py-1.5">
              <span className="text-muted-foreground">Score:</span>{' '}
              <span className="font-bold">{score}/100</span>
            </div>
            <div className="bg-muted/50 rounded-lg px-3 py-1.5">
              <span className="text-muted-foreground">Distributed:</span>{' '}
              <span className="font-bold">{submittedCount}/{destinations.length}</span>
            </div>
            <div className="bg-muted/50 rounded-lg px-3 py-1.5">
              <span className="text-muted-foreground">Approved:</span>{' '}
              <span className="font-bold text-green-500">{approvedCount}</span>
            </div>
          </div>
          {/* Missing fields */}
          {missingFields.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Unlock higher citability:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {missingFields.slice(0, 3).map(f => (
                  <button
                    key={f.field}
                    onClick={() => onNavigate('/dashboard')}
                    className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full cursor-pointer hover:bg-amber-500/20 transition"
                  >
                    + {f.field} ({f.impact})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Boost CTA */}
        <button
          onClick={() => onNavigate('/boost')}
          className="bg-gradient-to-r from-primary to-violet-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 transition flex items-center gap-2 flex-shrink-0 shadow-lg"
        >
          <Zap className="h-4 w-4" /> GQI Boost
        </button>
      </div>

      {/* Distribution Checklist */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('checklist')}
          className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition"
        >
          <h2 className="text-base font-bold font-display flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Distribution Checklist
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
              {submittedCount}/{destinations.length}
            </span>
          </h2>
          {expandedSections.checklist ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {expandedSections.checklist && (
          <div className="border-t border-border divide-y divide-border">
            {destinations.map(dest => {
              const st = destStatuses[dest.id] || 'not_started';
              const stInfo = STATUS_LABELS[st];
              const StIcon = stInfo.icon;
              const outUrl = `/api/out?projectId=${project?.id}&url=${encodeURIComponent(dest.url)}&source=${dest.id}`;
              return (
                <div key={dest.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition group">
                  <button
                    onClick={() => cycleStatus(dest.id)}
                    className="cursor-pointer flex-shrink-0 p-0.5"
                    title={`Status: ${stInfo.label} — Click to change`}
                  >
                    <StIcon className={`h-5 w-5 ${stInfo.color} transition-colors`} />
                  </button>
                  <span className="text-base flex-shrink-0">{dest.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{dest.name}</div>
                    <div className="text-[10px] text-muted-foreground">{dest.notes}</div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${st === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-500' : st === 'submitted' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-muted border-border text-muted-foreground'}`}>
                    {stInfo.label}
                  </span>
                  <a
                    href={outUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-muted transition cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title={`Open ${dest.name}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Copy Pack */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('copypack')}
          className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition"
        >
          <h2 className="text-base font-bold font-display flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Copy Pack
          </h2>
          {expandedSections.copypack ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {expandedSections.copypack && project && (
          <div className="border-t border-border p-4 space-y-4">
            {/* One-liner */}
            <CopyBlock
              label="One-liner"
              text={generateOneLiner(project)}
              charLimit={120}
              onCopy={() => trackCopy('one-liner')}
            />
            {/* Short */}
            <CopyBlock
              label="Short Description"
              text={generateShort(project)}
              charLimit={280}
              onCopy={() => trackCopy('short')}
            />
            {/* Full */}
            <CopyBlock
              label="Full Description"
              text={generateFull(project)}
              multiline
              onCopy={() => trackCopy('full')}
            />
            {/* Hashtags */}
            <CopyBlock
              label="Hashtags"
              text={generateHashtags(project)}
              onCopy={() => trackCopy('hashtags')}
            />
            {/* Profile Link */}
            <CopyBlock
              label="CitableHub Profile"
              text={profileUrl}
              onCopy={() => trackCopy('profile-link')}
            />
            {/* Citations */}
            <div className="space-y-2 pt-2 border-t border-border">
              <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Quote className="h-3 w-3" /> Ready-made Citations
              </h3>
              <CopyBlock label="APA" text={generateAPACitation(project, siteUrl)} onCopy={() => trackCopy('citation-apa')} />
              <CopyBlock label="BibTeX" text={generateBibTeX(project, siteUrl)} multiline onCopy={() => trackCopy('citation-bibtex')} />
              <CopyBlock label="MLA" text={generateMLACitation(project, siteUrl)} onCopy={() => trackCopy('citation-mla')} />
            </div>
          </div>
        )}
      </section>

      {/* UTM Generator */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('utm')}
          className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition"
        >
          <h2 className="text-base font-bold font-display flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            UTM Link Generator
          </h2>
          {expandedSections.utm ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {expandedSections.utm && project?.url && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Source</label>
                <input
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="e.g. producthunt, twitter"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Campaign</label>
                <input
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="e.g. launch"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            {utmSource && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs break-all text-primary">
                    {generateUTMLink(project.url, utmSource, 'directory', utmCampaign)}
                  </code>
                  <CopyBtn text={generateUTMLink(project.url, utmSource, 'directory', utmCampaign)} label="UTM Link" />
                </div>
              </div>
            )}
            {/* Quick UTM for each destination */}
            <div className="space-y-1 pt-2 border-t border-border">
              <h4 className="text-xs font-bold text-muted-foreground">Quick Links by Destination</h4>
              <div className="grid gap-1">
                {destinations.slice(0, 5).map(d => {
                  const link = generateUTMLink(project.url, d.id, 'directory', utmCampaign || 'launch');
                  return (
                    <div key={d.id} className="flex items-center gap-2 text-xs">
                      <span>{d.icon}</span>
                      <span className="font-medium w-28 truncate">{d.name}</span>
                      <code className="flex-1 text-[10px] text-muted-foreground truncate">{link}</code>
                      <CopyBtn text={link} label={`${d.name} UTM`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {expandedSections.utm && !project?.url && (
          <div className="border-t border-border p-4 text-sm text-muted-foreground">
            Add a project URL first to generate UTM links.
          </div>
        )}
      </section>

      {/* Full Submission Pack */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('pack')}
          className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition"
        >
          <h2 className="text-base font-bold font-display flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Full Submission Pack
          </h2>
          {expandedSections.pack ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {expandedSections.pack && project && (
          <div className="border-t border-border p-4">
            <div className="bg-muted/30 rounded-lg p-4 relative">
              <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-foreground/80">
                {generateSubmissionPack(project, siteUrl)}
              </pre>
              <div className="absolute top-2 right-2">
                <CopyBtn text={generateSubmissionPack(project, siteUrl)} label="Submission Pack" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Back to Dashboard */}
      <div className="flex justify-center pt-2 pb-8">
        <button
          onClick={() => onNavigate('/dashboard')}
          className="text-sm text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          ← Back to Dashboard
        </button>
      </div>
    </motion.div>
  );
}

/* Reusable copy block */
function CopyBlock({ label, text, charLimit, multiline, onCopy }: {
  label: string;
  text: string;
  charLimit?: number;
  multiline?: boolean;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success(`${label} copied`);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">{label}</span>
        {charLimit && (
          <span className={`text-[10px] font-mono ${text.length > charLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
            {text.length}/{charLimit}
          </span>
        )}
      </div>
      <div className="bg-muted/30 rounded-lg px-3 py-2 flex items-start gap-2 group">
        {multiline ? (
          <pre className="flex-1 text-xs whitespace-pre-wrap font-mono leading-relaxed text-foreground/80 min-h-[40px]">{text || '—'}</pre>
        ) : (
          <p className="flex-1 text-sm text-foreground/90 leading-relaxed">{text || '—'}</p>
        )}
        <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted transition cursor-pointer flex-shrink-0 mt-0.5" title="Copy">
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}
