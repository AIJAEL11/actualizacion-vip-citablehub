"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, TrendingUp, Check, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface BoostViewProps {
  onNavigate: (path: string) => void;
  categories: any[];
}

const BOOST_PACKAGES = [
  { id: 'starter', name: 'Starter', gqi: 2000, price: 100, desc: 'Perfect for early-stage launches.', duration: '24h' },
  { id: 'launch', name: 'Launch', gqi: 6000, price: 250, desc: 'Accelerate your market presence.', duration: '7 days' },
  { id: 'growth', name: 'Growth', gqi: 15000, price: 500, desc: 'Maximum discovery exposure.', duration: '30 days' },
];

export default function BoostView({ onNavigate, categories }: BoostViewProps) {
  const { data: session } = useSession() || {};
  const [selectedPack, setSelectedPack] = useState('launch');
  const [projectUrl, setProjectUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectEmail, setProjectEmail] = useState('');
  const [category, setCategory] = useState('developer-tools');
  const [loading, setLoading] = useState(false);

  const handleBoost = async () => {
    if (!projectUrl || !projectName) {
      toast.error('Please fill in project URL and name');
      return;
    }

    // Check authentication
    if (!session?.user) {
      toast.info('Inicia sesión para comprar un boost');
      onNavigate('/auth/signin');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'boost',
          boostPackId: selectedPack,
          projectName,
          projectUrl,
          projectEmail: projectEmail || (session?.user as any)?.email || '',
          category,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(data?.error || 'Error al crear la sesión de pago');
      }
    } catch (err) {
      toast.error('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 py-4">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Zap className="h-3.5 w-3.5" />
          Guaranteed Qualified Impressions
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">GQI Boost Campaigns</h1>
        <p className="text-muted-foreground">Only pay for intent-matched, qualified discovery impressions. No wasted budget.</p>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {BOOST_PACKAGES.map((pack: any) => (
          <div
            key={pack?.id}
            onClick={() => setSelectedPack(pack?.id)}
            className={`bg-card border rounded-xl p-6 space-y-4 cursor-pointer transition hover:shadow-md ${
              selectedPack === pack?.id ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display">{pack?.name}</h3>
              {selectedPack === pack?.id && <Check className="h-5 w-5 text-primary" />}
            </div>
            <div className="text-3xl font-black font-display">${pack?.price}</div>
            <p className="text-sm text-muted-foreground">{pack?.desc}</p>
            <div className="flex items-center gap-2 text-xs font-mono">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold">{(pack?.gqi ?? 0).toLocaleString()} GQI</span>
              <span className="text-muted-foreground">· {pack?.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign Form */}
      <div className="max-w-xl mx-auto bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-bold font-display text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Launch Campaign
        </h3>
        <div className="space-y-3">
          <input value={projectName} onChange={(e: any) => setProjectName(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Project Name" />
          <input value={projectUrl} onChange={(e: any) => setProjectUrl(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Project URL" />
          <input value={projectEmail} onChange={(e: any) => setProjectEmail(e?.target?.value ?? '')} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Contact Email" />
          <select value={category} onChange={(e: any) => setCategory(e?.target?.value ?? 'developer-tools')} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none">
            {(categories ?? []).map((c: any) => <option key={c?.id} value={c?.id}>{c?.name}</option>)}
            {(categories ?? []).length === 0 && <option value="developer-tools">Developer Tools</option>}
          </select>
        </div>
        <button
          onClick={handleBoost}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            <>Launch Boost <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </motion.div>
  );
}
