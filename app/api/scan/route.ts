export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auditPlatform } from '@/lib/geo-audit';
import { isSafePublicUrl } from '@/lib/url-guard';
import { prisma } from '@/lib/db';

/**
 * Public, no-login GEO scan. Given any URL, returns a 0-100 GEO score with a
 * breakdown and recommendations — a viral acquisition tool. Reuses the same
 * audit engine as the MCP citablehub_analyze tool. SSRF-guarded.
 */
export async function POST(req: NextRequest) {
  let raw = '';
  try {
    const body = await req.json();
    raw = (body?.url || '').toString().trim();
  } catch {}

  if (!raw) return NextResponse.json({ error: 'Provide a url.' }, { status: 400 });

  // Be forgiving: prepend https:// if the user omitted the scheme.
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  const guard = isSafePublicUrl(raw);
  if (!guard.ok || !guard.url) {
    return NextResponse.json({ error: guard.reason || 'Invalid URL.' }, { status: 400 });
  }

  const host = guard.url.hostname.replace(/^www\./, '');

  let result;
  try {
    result = await auditPlatform({ url: guard.url.toString(), name: host, description: '', stack: [] });
  } catch {
    return NextResponse.json({ error: 'Could not scan that site right now.' }, { status: 502 });
  }

  // Fire-and-forget analytics (anonymous) — helps surface demand without PII.
  prisma.analyticsEvent
    .create({ data: { type: 'public_scan', metadata: { host, score: result.score } } })
    .catch(() => {});

  return NextResponse.json({ host, ...result });
}
