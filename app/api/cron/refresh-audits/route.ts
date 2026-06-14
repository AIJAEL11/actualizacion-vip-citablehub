export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auditPlatform } from '@/lib/geo-audit';

/**
 * Periodic freshness job. Re-audits the least-recently-updated platforms,
 * records a new GeoAudit, refreshes Platform.geoScore, and bumps the linked
 * Project.lastReviewed so the directory stays "fresh" for AI crawlers.
 *
 * Protect with CRON_SECRET and call from any scheduler, e.g.:
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://citablehub.com/api/cron/refresh-audits
 */
const BATCH = 25;

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    req.nextUrl.searchParams.get('secret') ||
    '';

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let platforms: any[] = [];
  try {
    platforms = await prisma.platform.findMany({
      where: { status: { in: ['analyzed', 'listed'] } },
      orderBy: { updatedAt: 'asc' },
      take: BATCH,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Platform table unavailable (run the MCP Gateway migration first).' }, { status: 500 });
  }

  let refreshed = 0;
  for (const p of platforms) {
    try {
      const r = await auditPlatform({ name: p.name, url: p.url, description: p.description, stack: p.stack });
      await prisma.geoAudit.create({ data: { platformId: p.id, score: r.score, breakdown: r.breakdown as any, source: 'cron' } });
      await prisma.platform.update({ where: { id: p.id }, data: { geoScore: r.score } });
      if (p.projectId) {
        await prisma.project.update({ where: { id: p.projectId }, data: { lastReviewed: new Date() } }).catch(() => {});
      }
      refreshed += 1;
    } catch {
      // Skip this platform; continue the batch.
    }
  }

  return NextResponse.json({ ok: true, scanned: platforms.length, refreshed });
}

export async function POST(req: NextRequest) {
  return run(req);
}

export async function GET(req: NextRequest) {
  return run(req);
}
