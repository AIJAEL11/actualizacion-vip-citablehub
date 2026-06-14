"use client";

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Eye, MousePointer, Bookmark, CheckCircle, ArrowUpRight, Pencil, X, Loader2, Save, Image as ImageIcon, Globe, Megaphone, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import NotificationBell from '@/components/notification-bell';
import BoostResults from '@/components/boost-results';
import { toast } from 'sonner';

interface DashboardViewProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
  projects: any[];
}

function LogoFallback({ name }: { name: string }) {
  const colors = ['#6D28D9', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];
  const idx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg text-white flex-shrink-0" style={{ backgroundColor: colors[idx] }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export default function DashboardView({ onNavigate, projects }: DashboardViewProps) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [localProjects, setLocalProjects] = useState<any[]>(projects ?? []);
  const [showEditAdvanced, setShowEditAdvanced] = useState(false);

  if (!session) {
    return (
      <div className="py-16 text-center space-y-4">
        <LayoutDashboard className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold font-display">Sign in to view your dashboard</h2>
        <button onClick={() => router.push('/auth/signin')} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold cursor-pointer hover:bg-primary/90 transition">Sign In</button>
      </div>
    );
  }

  const userId = (session?.user as any)?.id;
  const myProjects = (localProjects ?? []).filter((p: any) => p?.ownerId === userId);
  const totalImpressions = myProjects.reduce((sum: number, p: any) => sum + (Number(p?.impressions) || 0), 0);
  const totalClicks = myProjects.reduce((sum: number, p: any) => sum + (Number(p?.clicks) || 0), 0);

  const startEdit = (p: any) => {
    setEditingProject(p);
    setEditForm({
      name: p?.name || '',
      summary: p?.summary || '',
      description: p?.description || '',
      outcome: p?.outcome || '',
      targetAudience: p?.targetAudience || '',
      url: p?.url || '',
      email: p?.email || '',
      founderName: p?.founderName || '',
      version: p?.version || '',
      demoUrl: p?.demoUrl || '',
      supportUrl: p?.supportUrl || '',
      privacyUrl: p?.privacyUrl || '',
      contactUrl: p?.contactUrl || '',
      differentiators: Array.isArray(p?.differentiators) ? p.differentiators.join(', ') : '',
      alternatives: Array.isArray(p?.alternatives) ? p.alternatives.join(', ') : '',
      platformType: p?.platformType || '',
      businessType: p?.businessType || '',
    });
    setLogoPreview(p?.logoUrl || null);
    setLogoFile(null);
    setShowEditAdvanced(false);
  };

  const handleSave = async () => {
    if (!editingProject?.id) return;
    setSaving(true);
    try {
      // Upload new logo if selected
      let logoUrl = editingProject?.logoUrl || null;
      if (logoFile) {
        const presRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: logoFile.name, contentType: logoFile.type, isPublic: true }),
        });
        const { uploadUrl, cloud_storage_path, publicUrl } = await presRes.json();
        if (uploadUrl) {
          const urlObj = new URL(uploadUrl);
          const signedHeaders = urlObj.searchParams.get('X-Amz-SignedHeaders') || '';
          const headers: Record<string, string> = { 'Content-Type': logoFile.type };
          if (signedHeaders.includes('content-disposition')) headers['Content-Disposition'] = 'attachment';
          await fetch(uploadUrl, { method: 'PUT', headers, body: logoFile });
          logoUrl = publicUrl || cloud_storage_path;
        }
      }

      // Process array fields before sending
      const formData = { ...editForm };
      if (typeof formData.differentiators === 'string') {
        formData.differentiators = formData.differentiators.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (typeof formData.alternatives === 'string') {
        formData.alternatives = formData.alternatives.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, logoUrl }),
      });
      if (!res.ok) throw new Error('Update failed');
      
      // Update local state instead of reloading — stay on dashboard
      setLocalProjects(prev => prev.map(p =>
        p.id === editingProject.id ? { ...p, ...editForm, logoUrl } : p
      ));
      toast.success('Project updated!');
      setEditingProject(null);
    } catch (err: any) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 py-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight font-display flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Manage your listed projects and track performance.</p>
        </div>
        <NotificationBell onNavigate={onNavigate} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Projects', value: myProjects?.length ?? 0, icon: Bookmark },
          { label: 'Impressions', value: totalImpressions, icon: Eye },
          { label: 'Clicks', value: totalClicks, icon: MousePointer },
          { label: 'Verified', value: myProjects.filter((p: any) => p?.verificationStatus === 'verified')?.length ?? 0, icon: CheckCircle },
        ].map((kpi: any, i: number) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-1">
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
            <div className="text-2xl font-black font-display">{kpi?.value ?? 0}</div>
            <div className="text-xs text-muted-foreground font-mono uppercase">{kpi?.label}</div>
          </div>
        ))}
      </div>

      {/* Promotion Center Banner */}
      {(myProjects ?? []).length > 0 && (
        <div className="bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold font-display text-sm">Promotion Center</h3>
            <p className="text-xs text-muted-foreground">Get ready-to-use copy, distribution checklists, UTM links, and citations for your projects.</p>
          </div>
          <button
            onClick={() => onNavigate('/dashboard/promotion', { projectId: myProjects[0]?.id })}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition flex items-center gap-2 flex-shrink-0 shadow-md"
          >
            <Megaphone className="h-4 w-4" /> Open Promotion Center
          </button>
        </div>
      )}

      {/* Boost Results */}
      {(myProjects ?? []).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold font-display">Boost Results</h2>
          <BoostResults />
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-display">Your Projects</h2>
        {(myProjects ?? []).length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
            <p className="text-muted-foreground">No projects yet.</p>
            <button onClick={() => onNavigate('/submit')} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-primary/90 transition">Submit Your First Project</button>
          </div>
        ) : (
          <div className="space-y-3">
            {myProjects.map((p: any) => (
              <div key={p?.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 group">
                {p?.logoUrl ? (
                  <img src={p.logoUrl} alt={p?.name} className="w-10 h-10 rounded-lg object-contain bg-muted flex-shrink-0" />
                ) : (
                  <LogoFallback name={p?.name || ''} />
                )}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onNavigate(`/p/${p?.slug}`)}>
                  <h3 className="font-bold truncate group-hover:text-primary transition">{p?.name}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                    <span className="capitalize bg-muted px-1.5 py-0.5 rounded">{p?.status}</span>
                    {(p?.impressions ?? 0) > 0 && <span>{p.impressions} views</span>}
                    {(p?.clicks ?? 0) > 0 && <span>{p.clicks} clicks</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onNavigate('/dashboard/promotion', { projectId: p?.id })} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-bold">
                    <Megaphone className="h-3.5 w-3.5" /> Promote
                  </button>
                  <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-muted transition cursor-pointer" title="Edit project">
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </button>
                  <button onClick={() => onNavigate(`/p/${p?.slug}`)} className="p-2 rounded-lg hover:bg-muted transition cursor-pointer" title="View profile">
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-display flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-primary" />
                  Edit: {editingProject?.name}
                </h3>
                <button onClick={() => setEditingProject(null)} className="p-1.5 rounded-lg hover:bg-muted cursor-pointer"><X className="h-5 w-5" /></button>
              </div>

              {/* Logo Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Logo</label>
                <div onClick={() => logoInputRef.current?.click()} className="flex items-center gap-3 cursor-pointer group">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <LogoFallback name={editingProject?.name || ''} />
                  )}
                  <span className="text-xs text-muted-foreground group-hover:text-primary transition">Click to change logo</span>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
                    setLogoFile(f);
                    const r = new FileReader(); r.onload = (ev) => setLogoPreview(ev.target?.result as string); r.readAsDataURL(f);
                  }
                }} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold">Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Website URL</label>
                <input value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Summary</label>
                <input value={editForm.summary} onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Citable Outcome</label>
                <textarea value={editForm.outcome} onChange={(e) => setEditForm({ ...editForm, outcome: e.target.value })} rows={2} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Target Audience</label>
                <input value={editForm.targetAudience} onChange={(e) => setEditForm({ ...editForm, targetAudience: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              {/* Trust & Positioning (collapsible) */}
              <div className="bg-emerald-500/[0.04] border-2 border-emerald-500/30 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowEditAdvanced(!showEditAdvanced)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold cursor-pointer hover:bg-emerald-500/10 transition"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" /> Trust & Positioning
                    <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">HIGH IMPACT FOR AI</span>
                  </span>
                  {showEditAdvanced ? <ChevronUp className="h-4 w-4 text-emerald-500" /> : <ChevronDown className="h-4 w-4 text-emerald-500" />}
                </button>
                {showEditAdvanced && (
                  <div className="px-4 pb-4 space-y-3 border-t border-emerald-500/20 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground">Founder / Team</label>
                        <input value={editForm.founderName} onChange={(e) => setEditForm({ ...editForm, founderName: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="Jane Smith" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground">Version</label>
                        <input value={editForm.version} onChange={(e) => setEditForm({ ...editForm, version: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="2.1.0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground">Demo URL</label>
                        <input value={editForm.demoUrl} onChange={(e) => setEditForm({ ...editForm, demoUrl: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="https://demo.app.com" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground">Support URL</label>
                        <input value={editForm.supportUrl} onChange={(e) => setEditForm({ ...editForm, supportUrl: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="https://docs.app.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground">Privacy Policy URL</label>
                        <input value={editForm.privacyUrl} onChange={(e) => setEditForm({ ...editForm, privacyUrl: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="https://app.com/privacy" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground">Contact Page URL</label>
                        <input value={editForm.contactUrl} onChange={(e) => setEditForm({ ...editForm, contactUrl: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="https://app.com/contact" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Differentiators <span className="font-normal">(comma-separated)</span></label>
                      <input value={editForm.differentiators} onChange={(e) => setEditForm({ ...editForm, differentiators: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="Open-source, No-code, SOC2" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Alternatives <span className="font-normal">(comma-separated)</span></label>
                      <input value={editForm.alternatives} onChange={(e) => setEditForm({ ...editForm, alternatives: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none" placeholder="Vercel, Netlify, Railway" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground">Platform Type</label>
                        <select value={editForm.platformType} onChange={(e) => setEditForm({ ...editForm, platformType: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none">
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
                        <select value={editForm.businessType} onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none">
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

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingProject(null)} className="flex-1 bg-muted py-3 rounded-lg font-bold text-sm cursor-pointer hover:bg-muted/80 transition">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-bold text-sm cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
