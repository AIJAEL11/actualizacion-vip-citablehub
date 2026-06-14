export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Outbound redirect with tracking.
 * GET /api/out?projectId=xxx&url=https://...&source=producthunt
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const projectId = searchParams.get('projectId') || '';
  const url = searchParams.get('url') || '';
  const source = searchParams.get('source') || 'unknown';

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Track the outbound click (fire-and-forget)
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://citablehub.com';
    fetch(`${baseUrl}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'promotion_outbound_click',
        projectId: projectId || undefined,
        metadata: { url, source },
      }),
    }).catch(() => {});
  } catch {}

  // 302 redirect to the target URL
  return NextResponse.redirect(url, 302);
}
