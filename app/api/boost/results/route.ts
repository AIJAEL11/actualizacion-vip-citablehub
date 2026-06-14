export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { gqiFromEvents, liftPct, boostSummary, GqiBreakdown } from '@/lib/gqi';

const SIGNAL_TYPES = ['project_impression', 'search_impression', 'project_view', 'project_click', 'project_click_website', 'project_save'];

async function eventsFor(projectId: string, from: Date, to: Date) {
  try {
    return await prisma.analyticsEvent.findMany({
      where: { projectId, createdAt: { gte: from, lt: to }, type: { in: SIGNAL_TYPES } },
      select: { type: true, metadata: true, createdAt: true },
    });
  } catch {
    return [];
  }
}

/** Per-boost results for the signed-in user: delivered GQI, engagement, and lift vs baseline. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let boosts: any[] = [];
  try {
    boosts = await prisma.boostOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch {
    return NextResponse.json({ boosts: [] });
  }

  const now = Date.now();

  const results = await Promise.all(
    boosts.map(async (b) => {
      const start = b.boostStartDate ? new Date(b.boostStartDate) : null;
      const endRaw = b.boostEndDate ? new Date(b.boostEndDate) : null;

      let delivered: GqiBreakdown = { gqi: b.gqiDelivered ?? 0, impressions: b.impressionsDelivered ?? 0, clicks: 0, websiteClicks: 0, saves: 0, aiBotImpressions: 0 };
      let baseline: GqiBreakdown | null = null;
      let daysRemaining: number | null = null;

      if (start && b.projectId) {
        const windowEnd = endRaw ? new Date(Math.min(endRaw.getTime(), now)) : new Date(now);
        const lenMs = Math.max(windowEnd.getTime() - start.getTime(), 1);
        const baselineStart = new Date(start.getTime() - lenMs);

        const [curEvents, baseEvents] = await Promise.all([
          eventsFor(b.projectId, start, windowEnd),
          eventsFor(b.projectId, baselineStart, start),
        ]);
        delivered = gqiFromEvents(curEvents);
        baseline = gqiFromEvents(baseEvents);

        if (endRaw) {
          daysRemaining = Math.max(0, Math.ceil((endRaw.getTime() - now) / 86_400_000));
        }
      }

      const lift = baseline
        ? {
            gqi: liftPct(delivered.gqi, baseline.gqi),
            impressions: liftPct(delivered.impressions, baseline.impressions),
            clicks: liftPct(delivered.clicks, baseline.clicks),
            websiteClicks: liftPct(delivered.websiteClicks, baseline.websiteClicks),
            saves: liftPct(delivered.saves, baseline.saves),
          }
        : null;

      let rankPosition: number | null = null;
      if (b.projectId) {
        try {
          const proj = await prisma.project.findUnique({ where: { id: b.projectId }, select: { rankPosition: true } });
          rankPosition = proj?.rankPosition ?? null;
        } catch {}
      }

      return {
        id: b.id,
        projectName: b.projectName,
        projectId: b.projectId,
        packType: b.packType,
        amount: b.amount ?? b.paymentAmount ?? 0,
        status: b.status,
        gqiLimit: b.gqiLimit ?? 0,
        gqiDelivered: delivered.gqi,
        startedAt: start?.toISOString() ?? null,
        endsAt: endRaw?.toISOString() ?? null,
        daysRemaining,
        delivered,
        baseline,
        lift,
        rankPosition,
        summary: boostSummary({ packType: b.packType, delivered, impressionsLift: lift?.impressions ?? null, rankPosition }),
      };
    }),
  );

  return NextResponse.json({ boosts: results });
}
