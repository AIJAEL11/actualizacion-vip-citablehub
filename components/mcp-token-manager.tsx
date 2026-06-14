"use client";

import { useEffect, useState, useCallback } from 'react';
import { KeyRound, Plus, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import CopyButton from '@/components/copy-button';

interface TokenRow {
  id: string;
  label: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

/**
 * Lets a signed-in builder create, view, and revoke MCP Personal Access Tokens,
 * and copy a one-line connect command. The plaintext token is shown once.
 */
export default function McpTokenManager() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState('');
  const [freshToken, setFreshToken] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://citablehub.com';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mcp/tokens');
      if (res.status === 401) { setUnauth(true); return; }
      const data = await res.json();
      setTokens(data?.tokens ?? []);
    } catch {
      toast.error('Could not load tokens.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/mcp/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || 'MCP token' }),
      });
      if (res.status === 401) { setUnauth(true); return; }
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setFreshToken(data.token);
      setLabel('');
      toast.success('Token created — copy it now, it won’t be shown again.');
      load();
    } catch {
      toast.error('Could not create token.');
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      const res = await fetch(`/api/mcp/tokens?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      toast.success('Token revoked.');
      load();
    } catch {
      toast.error('Could not revoke token.');
    }
  };

  if (unauth) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold">Sign in to manage MCP tokens</p>
          <p className="text-muted-foreground">You need an account to generate a token. <a href="/auth/signin" className="text-primary hover:underline">Sign in</a>.</p>
        </div>
      </div>
    );
  }

  const connectCmd = (token: string) =>
    `claude mcp add --transport http citablehub ${origin}/api/mcp --header "Authorization: Bearer ${token}"`;

  return (
    <div className="space-y-5">
      {/* Fresh token panel */}
      {freshToken && (
        <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-primary"><KeyRound className="h-4 w-4" /> Your new token (shown once)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-card border border-border rounded-lg px-3 py-2 font-mono break-all">{freshToken}</code>
            <CopyButton value={freshToken} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-1">Connect from Claude Code</p>
            <div className="flex items-center gap-2">
              <pre className="flex-1 text-xs bg-card border border-border rounded-lg px-3 py-2 overflow-x-auto font-mono whitespace-pre-wrap break-all">{connectCmd(freshToken)}</pre>
              <CopyButton value={connectCmd(freshToken)} />
            </div>
          </div>
        </div>
      )}

      {/* Create */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Token label (e.g. My laptop)"
          className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
        />
        <button
          onClick={create}
          disabled={creating}
          className="inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Generate token
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tokens yet. Generate one to connect your MCP client.</p>
        ) : (
          tokens.map((t) => (
            <div key={t.id} className={`flex items-center justify-between bg-card border border-border rounded-xl px-4 py-2.5 ${t.revokedAt ? 'opacity-50' : ''}`}>
              <div className="text-sm">
                <span className="font-semibold">{t.label}</span>
                <span className="text-muted-foreground text-xs ml-2">
                  {t.revokedAt ? 'revoked' : t.lastUsedAt ? `last used ${new Date(t.lastUsedAt).toLocaleDateString()}` : 'never used'}
                </span>
              </div>
              {!t.revokedAt && (
                <button onClick={() => revoke(t.id)} className="text-muted-foreground hover:text-destructive transition" title="Revoke">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
