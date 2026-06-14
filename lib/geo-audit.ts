/**
 * GEO audit engine for MCP-registered platforms.
 *
 * Produces a 0-100 GEO score with a per-dimension breakdown and actionable
 * recommendations. Data-based dimensions are deterministic; "live" dimensions
 * do best-effort fetches of the platform's own URL (robots.txt, llms.txt,
 * ai-plugin.json) with a short timeout — failures degrade gracefully.
 */

export interface GeoDimension {
  key: string;
  label: string;
  score: number; // 0-100
  weight: number; // contribution weight
  detail: string;
}

export interface GeoAuditResult {
  score: number; // weighted 0-100
  breakdown: GeoDimension[];
  recommendations: string[];
}

export interface AuditablePlatform {
  name?: string | null;
  url?: string | null;
  description?: string | null;
  stack?: string[] | null;
}

const AI_BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

function isValidUrl(u?: string | null): boolean {
  if (!u) return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function origin(u: string): string {
  try {
    return new URL(u).origin;
  } catch {
    return u.replace(/\/+$/, '');
  }
}

async function fetchText(url: string, ms = 4000): Promise<{ ok: boolean; status: number; text: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'CitableHubBot/1.0 (+https://citablehub.com)' },
    });
    const text = res.ok ? (await res.text().catch(() => '')).slice(0, 20000) : '';
    return { ok: res.ok, status: res.status, text };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Heuristic: does this robots.txt permit (or at least not block) AI crawlers? */
function robotsAllowsAiBots(robotsTxt: string): { allowed: number; blocked: string[] } {
  const lower = robotsTxt.toLowerCase();
  const blocked: string[] = [];
  let allowed = 0;
  for (const bot of AI_BOTS) {
    const idx = lower.indexOf(bot.toLowerCase());
    if (idx === -1) {
      allowed += 1; // not named → governed by * (assume not specifically blocked)
      continue;
    }
    // Look at the block following this user-agent line for a bare "disallow: /"
    const after = lower.slice(idx, idx + 200);
    if (/disallow:\s*\/\s*(\n|$)/.test(after)) blocked.push(bot);
    else allowed += 1;
  }
  return { allowed, blocked };
}

export async function auditPlatform(platform: AuditablePlatform): Promise<GeoAuditResult> {
  const name = (platform.name || '').trim();
  const url = (platform.url || '').trim();
  const description = (platform.description || '').trim();
  const stack = Array.isArray(platform.stack) ? platform.stack.filter(Boolean) : [];

  const recommendations: string[] = [];

  // 1) Identity (data-based, deterministic)
  let identity = 0;
  if (name.length >= 2) identity += 30;
  if (isValidUrl(url)) identity += 40; else recommendations.push('Provide a valid https:// URL for the platform.');
  if (description.length >= 40) identity += 30;
  else recommendations.push('Write a clear 1-2 sentence value proposition (40+ characters).');

  // 2) Classification (data-based)
  let classification = 0;
  if (stack.length >= 1) classification += 50; else recommendations.push('Declare your stack/tech tags so AIs can match relevant queries.');
  if (stack.length >= 3) classification += 25;
  if (description.length >= 120) classification += 25;

  // Live checks (best-effort)
  let reachability = 0;
  let structured = 0;
  let crawlability = 0;

  if (isValidUrl(url)) {
    const base = origin(url);
    const [home, robots, llms, aiPlugin] = await Promise.all([
      fetchText(base, 5000),
      fetchText(`${base}/robots.txt`),
      fetchText(`${base}/llms.txt`),
      fetchText(`${base}/.well-known/ai-plugin.json`),
    ]);

    // Reachability
    if (home?.ok) reachability = 100;
    else { reachability = 0; recommendations.push('The site did not return a 200 — make sure it is publicly reachable.'); }

    // Structured discovery files
    if (llms?.ok) structured += 50; else recommendations.push('Add an llms.txt — use citablehub_generate to get one ready to paste.');
    if (aiPlugin?.ok) structured += 50; else recommendations.push('Add /.well-known/ai-plugin.json — citablehub_generate produces it.');

    // Crawlability via robots.txt
    if (robots?.ok && robots.text) {
      const { allowed, blocked } = robotsAllowsAiBots(robots.text);
      crawlability = Math.round((allowed / AI_BOTS.length) * 100);
      if (blocked.length) recommendations.push(`robots.txt blocks ${blocked.join(', ')} — allow AI crawlers to be citable.`);
    } else {
      // No robots.txt usually means everything is allowed.
      crawlability = 80;
      recommendations.push('Add a robots.txt that explicitly Allows GPTBot, ClaudeBot, and PerplexityBot.');
    }
  } else {
    recommendations.push('Live GEO checks were skipped because the URL is invalid.');
  }

  const breakdown: GeoDimension[] = [
    { key: 'identity', label: 'Identity', score: identity, weight: 0.2, detail: 'Name, URL, and value proposition.' },
    { key: 'reachability', label: 'Reachability', score: reachability, weight: 0.15, detail: 'Site responds publicly with 200.' },
    { key: 'crawlability', label: 'AI Crawlability', score: crawlability, weight: 0.25, detail: 'robots.txt permits AI crawlers.' },
    { key: 'structured', label: 'Structured Discovery', score: structured, weight: 0.25, detail: 'llms.txt and ai-plugin.json present.' },
    { key: 'classification', label: 'Classification', score: classification, weight: 0.15, detail: 'Stack/tags and description depth.' },
  ];

  const score = Math.round(breakdown.reduce((s, d) => s + d.score * d.weight, 0));

  // De-duplicate recommendations, keep order.
  const seen = new Set<string>();
  const recs = recommendations.filter((r) => (seen.has(r) ? false : (seen.add(r), true)));

  return { score, breakdown, recommendations: recs };
}
