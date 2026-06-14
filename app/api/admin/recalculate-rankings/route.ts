export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateProjectScore, DECAY_DAYS, SignalSummary } from '@/lib/dynamic-ranking';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const since = new Date();
    since.setDate(since.getDate() - DECAY_DAYS);

    // Fetch all projects
    const projects = await prisma.project.findMany({
      where: { status: { not: 'rejected' } },
      select: {
        id: true, name: true, slug: true, isSeeded: true, platformPartner: true,
        boostScore: true, trustScore: true, impressions: true, clicks: true,
        savesCount: true, rankPosition: true, prevRankPosition: true, dynamicScore: true,
        // completeness fields
        url: true, summary: true, description: true, outcome: true,
        targetAudience: true, logoUrl: true, tags: true,
      },
    });

    // Fetch all relevant events in the decay window
    const events = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: since },
        type: {
          in: ['project_click', 'project_save', 'project_impression',
               'project_view', 'project_click_website', 'search_impression'],
        },
        projectId: { not: null },
      },
      select: { type: true, metadata: true, projectId: true },
    });

    // Group events by project
    const eventsByProject = new Map<string, typeof events>();
    for (const ev of events) {
      if (!ev.projectId) continue;
      const list = eventsByProject.get(ev.projectId) ?? [];
      list.push(ev);
      eventsByProject.set(ev.projectId, list);
    }

    // Calculate scores
    const summaries: SignalSummary[] = [];
    for (const project of projects) {
      const projectEvents = eventsByProject.get(project.id) ?? [];
      const summary = calculateProjectScore(projectEvents, project);
      summaries.push(summary);
    }

    // Sort by total score descending to assign ranks
    // Partners and seeded projects maintain tier structure,
    // but dynamicScore is still calculated for within-tier ordering
    const sortedByScore = [...summaries].sort((a, b) => b.totalScore - a.totalScore);

    // Assign rank positions (1-based)
    const rankMap = new Map<string, { rank: number; score: number }>();
    sortedByScore.forEach((s, i) => {
      rankMap.set(s.projectId, { rank: i + 1, score: s.totalScore });
    });

    // Batch update all projects
    const updates = projects.map((p) => {
      const info = rankMap.get(p.id)!;
      return prisma.project.update({
        where: { id: p.id },
        data: {
          prevRankPosition: p.rankPosition || 0,
          rankPosition: info.rank,
          dynamicScore: info.score,
        },
      });
    });

    await prisma.$transaction(updates);

    // Fire-and-forget: send ranking movement notifications for real (non-seeded) projects
    (async () => {
      try {
        const { triggerRankingMovement } = await import('@/lib/notifications');
        for (const p of projects) {
          if (p.isSeeded) continue;
          const oldRank = p.rankPosition || 0;
          const newRank = rankMap.get(p.id)!.rank;
          if (oldRank > 0 && Math.abs(oldRank - newRank) >= 3) {
            const owner = await prisma.project.findUnique({
              where: { id: p.id },
              select: { ownerId: true, owner: { select: { email: true } } },
            });
            if (owner?.ownerId && owner?.owner?.email) {
              await triggerRankingMovement(owner.ownerId, owner.owner.email, p, oldRank, newRank);
            }
          }
        }
      } catch (e) { console.error('[Notif trigger] ranking:', e); }
    })();

    // Build response
    const topMovers = sortedByScore.slice(0, 20).map((s) => {
      const p = projects.find((pr) => pr.id === s.projectId)!;
      const oldRank = p.rankPosition || 0;
      const newRank = rankMap.get(s.projectId)!.rank;
      return {
        name: p.name,
        slug: p.slug,
        isSeeded: p.isSeeded,
        platformPartner: p.platformPartner,
        oldRank,
        newRank,
        movement: oldRank > 0 ? oldRank - newRank : 0,
        score: s.totalScore,
        signals: s.humanSignals,
        botSignals: s.botSignals,
      };
    });

    return NextResponse.json({
      ok: true,
      totalProjects: projects.length,
      totalEvents: events.length,
      decayDays: DECAY_DAYS,
      topMovers,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Recalculate rankings error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
