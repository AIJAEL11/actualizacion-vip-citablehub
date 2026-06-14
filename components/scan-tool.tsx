"use client";

import { useState } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { scoreColor, scoreBand } from '@/lib/programmatic-pages';

interface Dimension { key: string; label: string; score: number; detail: string }
interface ScanResult { host: string; score: number; breakdown: Dimension[]; recommendations: string[] }

/** Public, no-login GEO scanner. Posts a URL to /api/scan and renders the audit. */
export default function ScanTool() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const scan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Scan failed');
      setResult(data);
    } catch (err: any) {
      toast.error(err?.message || 'Could not scan that site.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={scan} className="flex flex-col sm:flex-row gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourdomain.com"
          className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Scanning…' : 'Scan free'}
        </button>
      </form>

      {result && (
        <div className="space-y-5">
          {/* Score */}
          <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-5">
            <div className="text-center">
              <div className="font-mono font-black text-5xl leading-none" style={{ color: scoreColor(result.score) }}>{result.score}</div>
              <div className="text-xs text-muted-foreground">/100 GEO</div>
            </div>
            <div>
              <div className="font-bold font-display">{result.host}</div>
              <div className="text-sm" style={{ color: scoreColor(result.score) }}>{scoreBand(result.score)} AI-citability</div>
              <p className="text-xs text-muted-foreground mt-1">How ready your site is to be found and cited by AI search engines.</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            {result.breakdown.map((d) => (
              <div key={d.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{d.label}</span>
                  <span className="font-mono" style={{ color: scoreColor(d.score) }}>{d.score}/100</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${d.score}%`, backgroundColor: scoreColor(d.score) }} />
                </div>
                <p className="text-[11px] text-muted-foreground">{d.detail}</p>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">How to improve</div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {/* CTA — the funnel */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center space-y-3">
            <p className="text-sm font-semibold">CitableHub fixes most of this for you — free.</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <a href="/submit" className="inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition">
                List your project free <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/mcp" className="inline-flex items-center justify-center gap-1.5 bg-card border border-border px-4 py-2.5 rounded-xl font-bold text-sm hover:border-primary/40 transition">
                Connect via MCP
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
