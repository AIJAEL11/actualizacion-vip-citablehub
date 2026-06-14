"use client";

import { useState, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Rocket, Sparkles, Check, Loader2, ShieldAlert, Shield, Upload, Image as ImageIcon,
  Eye, X, Globe, Target, Zap, AlertCircle, Copy, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCitabilityScore, getMissingFieldSuggestions, generateOneLiner, generateShort, generateFull } from '@/lib/copy-generator';
import { getRecommendedDestinations } from '@/lib/destinations';

interface SubmitViewProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
  categories: any[];
  onProjectCreated: (p: any) => void;
}

function LogoFallback({ name, size = 'lg' }: { name: string; size?: 'sm' | 'lg' }) {
  const colors = ['#6D28D9', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];
  const idx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const sz = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-10 h-10 text-lg';
  return (
    <div className={`${sz} rounded-xl flex items-center justify-center font-black text-white flex-shrink-0`} style={{ backgroundColor: colors[idx] }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export default function SubmitView({ onNavigate, categories, onProjectCreated }: SubmitViewProps) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [category, setCategory] = useState('developer-tools');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successProject, setSuccessProject] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showLaunchKit, setShowLaunchKit] = useState(true);

  // New trust/positioning fields
  const [founderName, setFounderName] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [supportUrl, setSupportUrl] = useState('');
  const [privacyUrl, setPrivacyUrl] = useState('');
  const [contactUrl, setContactUrl] = useState('');
  const [version, setVersion] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [differentiators, setDifferentiators] = useState('');
  const [platformType, setPlatformType] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // File uploads
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Live citability data
  const projectData = useMemo(() => ({
    name, url, summary, description, outcome, targetAudience, tags,
    logoUrl: logoPreview || undefined,
    evidences: evidenceUrl ? [{ url: evidenceUrl }] : [],
  }), [name, url, summary, description, outcome, targetAudience, tags, logoPreview, evidenceUrl]);

  const citabilityScore = useMemo(() => getCitabilityScore(projectData as any), [projectData]);
  const missingSuggestions = useMemo(() => getMissingFieldSuggestions(projectData as any), [projectData]);
  const oneLiner = useMemo(() => generateOneLiner(projectData), [projectData]);
  const shortDesc = useMemo(() => generateShort(projectData), [projectData]);
  const fullDesc = useMemo(() => generateFull(projectData), [projectData]);
  const destinations = useMemo(() => getRecommendedDestinations(category, tags, 5), [category, tags]);

  if (!session) {
    return (
      <div className="py-16 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold font-display">Authentication Required</h2>
        <p className="text-muted-foreground">Sign in to submit your project for listing.</p>
        <button onClick={() => router.push('/auth/signin')} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold cursor-pointer hover:bg-primary/90 transition">Sign In</button>
      </div>
    );
  }

  const handleFileSelect = (file: File, type: 'logo' | 'cover') => {
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'logo') { setLogoFile(file); setLogoPreview(e.target?.result as string); }
      else { setCoverFile(file); setCoverPreview(e.target?.result as string); }
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const res = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
      });
      const { uploadUrl, cloud_storage_path, publicUrl } = await res.json();
      if (!uploadUrl) return null;
      const urlObj = new URL(uploadUrl);
      const signedHeaders = urlObj.searchParams.get('X-Amz-SignedHeaders') || '';
      const headers: Record<string, string> = { 'Content-Type': file.type };
      if (signedHeaders.includes('content-disposition')) headers['Content-Disposition'] = 'attachment';
      const uploadRes = await fetch(uploadUrl, { method: 'PUT', headers, body: file });
      if (!uploadRes.ok) return null;
      return publicUrl || cloud_storage_path;
    } catch (err) { console.error('Upload error:', err); return null; }
  };

  const handleAIAutofill = async () => {
    if (!url && !name) { toast.error('Enter a project name or URL first'); return; }
    setIsAutoFilling(true);
    try {
      const res = await fetch('/api/llm/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url || `https://${name.toLowerCase().replace(/\s+/g, '')}.com`, projectName: name, userSummary: summary, userDescription: description }),
      });
      const results = await res.json();
      if (results?.summary && !summary) setSummary(results.summary);
      if (results?.description && !description) setDescription(results.description);
      if (results?.outcome && !outcome) setOutcome(results.outcome);
      if (results?.targetAudience && !targetAudience) setTargetAudience(results.targetAudience);
      if (results?.mainCategory) setCategory(results.mainCategory);
      if (results?.tags?.length) setTags(results.tags.filter((t: string) => t !== 'other'));
      toast.success('AI autofill applied! Review and adjust as needed.');
    } catch { toast.error('AI autofill failed. Please fill manually.'); }
    finally { setIsAutoFilling(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url || !summary || !description || !outcome) { toast.error('Please fill all required fields'); return; }
    setIsSubmitting(true);
    try {
      let uploadedLogoPath: string | null = null;
      let uploadedCoverPath: string | null = null;
      if (logoFile) { setUploadingLogo(true); uploadedLogoPath = await uploadFile(logoFile); setUploadingLogo(false); }
      if (coverFile) { setUploadingCover(true); uploadedCoverPath = await uploadFile(coverFile); setUploadingCover(false); }
      const evidences = evidenceUrl ? [{ title: evidenceTitle || 'Evidence', type: 'url', content: evidenceUrl }] : [];
      const advancedFields: any = {};
      if (founderName?.trim()) advancedFields.founderName = founderName.trim();
      if (demoUrl?.trim()) advancedFields.demoUrl = demoUrl.trim();
      if (supportUrl?.trim()) advancedFields.supportUrl = supportUrl.trim();
      if (privacyUrl?.trim()) advancedFields.privacyUrl = privacyUrl.trim();
      if (contactUrl?.trim()) advancedFields.contactUrl = contactUrl.trim();
      if (version?.trim()) advancedFields.version = version.trim();
      if (platformType?.trim()) advancedFields.platformType = platformType.trim();
      if (businessType?.trim()) advancedFields.businessType = businessType.trim();
      if (alternatives?.trim()) advancedFields.alternatives = alternatives.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (differentiators?.trim()) advancedFields.differentiators = differentiators.split(',').map((s: string) => s.trim()).filter(Boolean);

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, email, summary, description, outcome, targetAudience, category, tags, evidences, logoUrl: uploadedLogoPath || null, coverUrl: uploadedCoverPath || null, ...advancedFields }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err?.error || 'Submission failed'); }
      const project = await res.json();
      setSuccessProject(project);
      onProjectCreated(project);
      toast.success('Project submitted successfully!');
    } catch (error: any) { toast.error(error?.message || 'Submission failed'); }
    finally { setIsSubmitting(false); }
  };

  // Post-submit: redirect to promotion center
  if (successProject) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-12 text-center space-y-6 max-w-xl mx-auto">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold font-display">Project Submitted!</h2>
        <p className="text-muted-foreground"><strong>{successProject?.name}</strong> is live. Now get it cited.</p>
        <div className="bg-card border border-border rounded-xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-bold">Citability Score: {citabilityScore}%</span>
          </div>
          <p className="text-xs text-muted-foreground">{citabilityScore >= 80 ? 'Great! Your project is well-structured for AI citation.' : 'Complete missing fields to improve your citability score.'}</p>
        </div>
        <div className="flex justify-center gap-3">
          <button onClick={() => onNavigate('/dashboard/promotion', { projectId: successProject?.id })} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold cursor-pointer hover:bg-primary/90 transition flex items-center gap-2">
            <Rocket className="h-4 w-4" /> Promote Your Project
          </button>
          <button onClick={() => onNavigate(`/p/${successProject?.slug}`)} className="bg-card border border-border px-6 py-3 rounded-lg font-bold cursor-pointer hover:shadow-md transition">View Profile</button>
        </div>
      </motion.div>
    );
  }

  const catName = (categories ?? []).find((c: any) => c?.id === category)?.name || category;
  const scoreColor = citabilityScore >= 80 ? 'text-emerald-500' : citabilityScore >= 50 ? 'text-blue-500' : 'text-amber-500';
  const scoreBg = citabilityScore >= 80 ? 'bg-emerald-500' : citabilityScore >= 50 ? 'bg-blue-500' : 'bg-amber-500';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" /> List Your Project
          </h1>
          <p className="text-muted-foreground text-sm">Get listed, verified, and cited by AI.</p>
        </div>
        <button type="button" onClick={handleAIAutofill} disabled={isAutoFilling}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm cursor-pointer transition flex items-center gap-2 disabled:opacity-50 shadow-lg">
          {isAutoFilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isAutoFilling ? 'Analyzing...' : 'AI Autofill'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form Column — 3/5 */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Project Name *</label>
                <input value={name} onChange={(e: any) => setName(e?.target?.value ?? '')} className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. ShipKit" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Website URL *</label>
                <input value={url} onChange={(e: any) => setUrl(e?.target?.value ?? '')} className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="https://yourproject.com" required />
              </div>
            </div>

            {/* Logo + Cover */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Project Logo</label>
                <div onClick={() => logoInputRef.current?.click()} className="bg-card border-2 border-dashed border-border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-primary/50 transition group">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(null); }} className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
                  )}
                  <div className="text-xs text-muted-foreground"><p className="font-semibold text-foreground group-hover:text-primary transition">Upload logo</p><p>PNG, JPG, WebP. Max 5MB.</p></div>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], 'logo'); }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Screenshot / Cover</label>
                <div onClick={() => coverInputRef.current?.click()} className="bg-card border-2 border-dashed border-border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-primary/50 transition group">
                  {coverPreview ? (
                    <div className="relative">
                      <img src={coverPreview} alt="Cover" className="w-12 h-12 rounded-xl object-cover" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }} className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
                  )}
                  <div className="text-xs text-muted-foreground"><p className="font-semibold text-foreground group-hover:text-primary transition">Upload screenshot</p><p>PNG, JPG, WebP. Max 5MB.</p></div>
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], 'cover'); }} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Contact Email</label>
                <input value={email} onChange={(e: any) => setEmail(e?.target?.value ?? '')} className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="team@yourproject.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Category</label>
                <select value={category} onChange={(e: any) => setCategory(e?.target?.value ?? 'developer-tools')} className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30">
                  {(categories ?? []).map((c: any) => <option key={c?.id} value={c?.id}>{c?.name}</option>)}
                  {(categories ?? []).length === 0 && <option value="developer-tools">Developer Tools</option>}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold">Summary * <span className="text-muted-foreground font-normal">(1 clear sentence)</span></label>
              <input value={summary} onChange={(e: any) => setSummary(e?.target?.value ?? '')} className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. Open-source CI/CD pipeline that automates Docker builds for Node.js apps." required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold">Description * <span className="text-muted-foreground font-normal">(What + Who + Benefit)</span></label>
              <textarea value={description} onChange={(e: any) => setDescription(e?.target?.value ?? '')} rows={3} className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="What does it do? Who is it for? What's the key benefit?" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold">Citable Outcome * <span className="text-muted-foreground font-normal">(Specific + Measurable)</span></label>
              <textarea value={outcome} onChange={(e: any) => setOutcome(e?.target?.value ?? '')} rows={2} className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="e.g. Reduces deployment failure rate by 40% for teams using GitHub Actions." required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold">Target Audience <span className="text-muted-foreground font-normal">(Role + Context)</span></label>
              <input value={targetAudience} onChange={(e: any) => setTargetAudience(e?.target?.value ?? '')} className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. Backend engineers at startups managing 5-50 microservices on AWS." />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold">Tags</label>
              <div className="flex flex-wrap gap-2">
                {(tags ?? []).map((t: string, i: number) => (
                  <span key={i} className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                    {t}
                    <button type="button" onClick={() => setTags((prev: string[]) => (prev ?? []).filter((_: string, idx: number) => idx !== i))} className="hover:text-destructive cursor-pointer">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={customTagInput} onChange={(e: any) => setCustomTagInput(e?.target?.value ?? '')} className="flex-1 bg-card border border-border rounded-lg px-3 py-1.5 text-xs outline-none" placeholder="Add custom tag"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (customTagInput?.trim()) { setTags((prev) => [...(prev ?? []), customTagInput.trim().toLowerCase()]); setCustomTagInput(''); } } }} />
                <button type="button" onClick={() => { if (customTagInput?.trim()) { setTags((prev) => [...(prev ?? []), customTagInput.trim().toLowerCase()]); setCustomTagInput(''); } }} className="text-xs bg-card border border-border px-3 py-1.5 rounded-lg font-bold cursor-pointer hover:bg-muted transition">Add</button>
              </div>
            </div>

            {/* Evidence */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Supporting Evidence</h3>
              <p className="text-[10px] text-muted-foreground">Link case studies, docs, or third-party reviews. AI systems weigh evidence heavily.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={evidenceTitle} onChange={(e: any) => setEvidenceTitle(e?.target?.value ?? '')} className="bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="Evidence title" />
                <input value={evidenceUrl} onChange={(e: any) => setEvidenceUrl(e?.target?.value ?? '')} className="bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="Evidence URL" />
              </div>
            </div>

            {/* Advanced Trust & Positioning */}
            <div className="bg-emerald-500/[0.04] border-2 border-emerald-500/30 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold cursor-pointer hover:bg-emerald-500/10 transition"
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" /> Trust & Positioning
                  <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">HIGH IMPACT FOR AI</span>
                </span>
                {showAdvanced ? <ChevronUp className="h-4 w-4 text-emerald-500" /> : <ChevronDown className="h-4 w-4 text-emerald-500" />}
              </button>
              {showAdvanced && (
                <div className="px-4 pb-4 space-y-3 border-t border-emerald-500/20 pt-3">
                  <p className="text-[10px] text-emerald-400/80 font-medium">🚀 These fields directly boost how AI systems (Google AI, Perplexity, ChatGPT) cite and recommend your project. More filled = higher visibility in AI search.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Founder / Team Lead</label>
                      <input value={founderName} onChange={(e: any) => setFounderName(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="Jane Smith" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Version</label>
                      <input value={version} onChange={(e: any) => setVersion(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="2.1.0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Demo URL</label>
                      <input value={demoUrl} onChange={(e: any) => setDemoUrl(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="https://demo.yourapp.com" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Support URL</label>
                      <input value={supportUrl} onChange={(e: any) => setSupportUrl(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="https://docs.yourapp.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Privacy Policy URL</label>
                      <input value={privacyUrl} onChange={(e: any) => setPrivacyUrl(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="https://yourapp.com/privacy" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Contact Page URL</label>
                      <input value={contactUrl} onChange={(e: any) => setContactUrl(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="https://yourapp.com/contact" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground">Differentiators <span className="font-normal">(comma-separated)</span></label>
                    <input value={differentiators} onChange={(e: any) => setDifferentiators(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="Open-source, No-code setup, SOC2 compliant" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground">Alternatives <span className="font-normal">(similar tools, comma-separated)</span></label>
                    <input value={alternatives} onChange={(e: any) => setAlternatives(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="Vercel, Netlify, Railway" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Platform Type</label>
                      <select value={platformType} onChange={(e: any) => setPlatformType(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none">
                        <option value="">Select...</option>
                        <option value="SaaS">SaaS</option>
                        <option value="Web App">Web App / PWA</option>
                        <option value="Mobile App">Mobile App (iOS/Android)</option>
                        <option value="Open Source">Open Source</option>
                        <option value="API">API / SDK</option>
                        <option value="Desktop">Desktop App</option>
                        <option value="Browser Extension">Browser Extension</option>
                        <option value="Marketplace">Marketplace</option>
                        <option value="Plugin">Plugin / Integration</option>
                        <option value="AI Tool">AI Tool / Agent</option>
                        <option value="Hardware">Hardware / IoT</option>
                        <option value="Game">Game / Interactive</option>
                        <option value="Platform">Platform / Ecosystem</option>
                        <option value="No-Code">No-Code / Low-Code</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Business Model</label>
                      <select value={businessType} onChange={(e: any) => setBusinessType(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none">
                        <option value="">Select...</option>
                        <option value="Freemium">Freemium</option>
                        <option value="Free">Free / Open Source</option>
                        <option value="Subscription">Subscription</option>
                        <option value="One-time">One-time Purchase</option>
                        <option value="Usage-based">Usage-based</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowPreview(!showPreview)} className="lg:hidden flex-1 bg-card border border-border py-3 rounded-lg font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 hover:shadow-md">
                <Eye className="h-4 w-4" /> {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-bold text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel — AI-Citable Launch Kit (2/5) */}
        <div className={`lg:col-span-2 ${showPreview ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-20 space-y-4">

            {/* Citability Score */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                  <Target className="h-3.5 w-3.5 text-primary" /> AI-Citable Launch Kit
                </h3>
                <button type="button" onClick={() => setShowLaunchKit(!showLaunchKit)} className="text-muted-foreground hover:text-primary cursor-pointer p-1">
                  {showLaunchKit ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Score Ring */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/50" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" strokeDasharray={`${citabilityScore}, 100`} strokeLinecap="round" className={scoreColor} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-black ${scoreColor}`}>{citabilityScore}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className={`text-sm font-bold ${scoreColor}`}>
                    {citabilityScore >= 80 ? 'AI-Citation Ready!' : citabilityScore >= 50 ? 'Getting There' : 'Needs Work'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{citabilityScore}% ready for AI citation</p>
                </div>
              </div>
            </div>

            {showLaunchKit && (
              <>
                {/* Unlock Prompts */}
                {missingSuggestions.length > 0 && (
                  <div className="bg-card border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Unlock Higher Citability
                    </p>
                    {missingSuggestions.slice(0, 3).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <Zap className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-foreground">{s.field}:</span>{' '}
                          <span className="text-muted-foreground">{s.suggestion}</span>
                          <span className="text-amber-500 font-bold ml-1">{s.impact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Generated Preview */}
                {(name || summary) && (
                  <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" /> Generated Preview
                    </p>

                    {oneLiner && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">One-liner ({oneLiner.length}/120)</span>
                          <button type="button" onClick={() => { navigator.clipboard.writeText(oneLiner); toast.success('Copied!'); }} className="text-primary hover:text-primary/80 cursor-pointer"><Copy className="h-3 w-3" /></button>
                        </div>
                        <p className="text-[11px] text-foreground bg-muted/50 rounded-lg px-2.5 py-1.5 font-medium">{oneLiner}</p>
                      </div>
                    )}

                    {shortDesc && summary && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Short ({shortDesc.length}/280)</span>
                          <button type="button" onClick={() => { navigator.clipboard.writeText(shortDesc); toast.success('Copied!'); }} className="text-primary hover:text-primary/80 cursor-pointer"><Copy className="h-3 w-3" /></button>
                        </div>
                        <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5 line-clamp-3">{shortDesc}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommended Destinations */}
                {destinations.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Globe className="h-3 w-3 text-primary" /> Promotion Targets
                    </p>
                    {destinations.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 text-[11px] py-1 border-b border-border/50 last:border-0">
                        <span className="text-sm">{d.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-foreground">{d.name}</span>
                        </div>
                      </div>
                    ))}
                    <p className="text-[9px] text-muted-foreground italic">More targets available after submit.</p>
                  </div>
                )}

                {/* Live Preview Card */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="px-3 pt-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Eye className="h-3 w-3" /> Card Preview</p>
                  </div>
                  {coverPreview ? (
                    <div className="h-20 bg-muted overflow-hidden mt-2"><img src={coverPreview} alt="Cover" className="w-full h-full object-cover" /></div>
                  ) : (
                    <div className="h-14 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent mt-2" />
                  )}
                  <div className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 -mt-5 border-2 border-card shadow-sm" />
                      ) : (
                        <div className="-mt-5"><LogoFallback name={name} size="sm" /></div>
                      )}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h4 className="font-bold text-xs truncate">{name || 'Project Name'}</h4>
                        <p className="text-[9px] text-muted-foreground font-mono capitalize">{catName}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{summary || 'Your summary will appear here...'}</p>
                    {(tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 3).map((t: string, i: number) => (<span key={i} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">{t}</span>))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
