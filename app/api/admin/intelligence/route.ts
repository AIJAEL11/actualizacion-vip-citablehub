export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BOT_PATTERNS = /bot|crawl|spider|slurp|semrush|ahref|mj12|dotbot|petalbot|bingpreview|yandex|baidu|duckduck|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|gptbot|google-extended|anthropic|claude|bytespider|amazonbot|applebot|ia_archiver|archive\.org/i;

function classifyUA(ua: string): 'bot' | 'human' {
  if (!ua) return 'human';
  return BOT_PATTERNS.test(ua) ? 'bot' : 'human';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    // Fetch recent analytics events (last 30 days, max 2000)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 2000,
      select: {
        id: true,
        type: true,
        projectId: true,
        metadata: true,
        createdAt: true,
      },
    });

    // ---- 1) SEARCH INTELLIGENCE ----
    const searchEvents = events.filter(e => e.type === 'search_query');
    const recentSearches = searchEvents.slice(0, 50).map(e => {
      const meta = (e.metadata as any) || {};
      return {
        id: e.id,
        query: meta.query || '',
        source: meta.source || 'unknown',
        timestamp: e.createdAt,
        projectsMatched: meta.projectsMatched || [],
        agentClass: meta.agentClass || classifyUA(meta.ua || ''),
      };
    });

    // ---- 2) BOT vs HUMAN BREAKDOWN ----
    let botCount = 0;
    let humanCount = 0;
    for (const e of events) {
      const meta = (e.metadata as any) || {};
      const cls = meta.agentClass || classifyUA(meta.ua || '');
      if (cls === 'bot') botCount++;
      else humanCount++;
    }
    const totalEvents = botCount + humanCount;
    const botHuman = {
      total: totalEvents,
      bot: botCount,
      human: humanCount,
      botPct: totalEvents > 0 ? Math.round((botCount / totalEvents) * 100) : 0,
      humanPct: totalEvents > 0 ? Math.round((humanCount / totalEvents) * 100) : 0,
    };

    // ---- 3) RANKING ACTIVITY (per project) ----
    const projects = await prisma.project.findMany({
      where: { status: { notIn: ['rejected', 'flagged', 'draft'] } },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        trustScore: true,
        boostScore: true,
        impressions: true,
        clicks: true,
        isSeeded: true,
        platformPartner: true,
        savesCount: true,
        dynamicScore: true,
        rankPosition: true,
        prevRankPosition: true,
      },
      orderBy: { dynamicScore: 'desc' },
    });

    // Count events per project
    const projectEventCounts: Record<string, { views: number; clicks: number; saves: number; submits: number; boosts: number; promotions: number }> = {};
    for (const e of events) {
      if (!e.projectId) continue;
      if (!projectEventCounts[e.projectId]) {
        projectEventCounts[e.projectId] = { views: 0, clicks: 0, saves: 0, submits: 0, boosts: 0, promotions: 0 };
      }
      const c = projectEventCounts[e.projectId];
      if (e.type === 'impression' || e.type === 'view') c.views++;
      else if (e.type === 'click') c.clicks++;
      else if (e.type === 'save' || e.type === 'bookmark') c.saves++;
      else if (e.type === 'submit') c.submits++;
      else if (e.type === 'boost' || e.type === 'boost_purchase') c.boosts++;
      else if (e.type.startsWith('promotion_')) c.promotions++;
    }

    const rankingActivity = projects.slice(0, 30).map((p, idx) => {
      const ec = projectEventCounts[p.id] || { views: 0, clicks: 0, saves: 0, submits: 0, boosts: 0, promotions: 0 };
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        rank: idx + 1,
        status: p.status,
        trustScore: Math.round((p.trustScore ?? 0) * 100),
        boostScore: p.boostScore ?? 0,
        impressions: p.impressions ?? 0,
        clicks: p.clicks ?? 0,
        isSeeded: p.isSeeded,
        platformPartner: p.platformPartner,
        savesCount: p.savesCount ?? 0,
        dynamicScore: p.dynamicScore ?? 0,
        rankPosition: p.rankPosition ?? 0,
        prevRankPosition: p.prevRankPosition ?? 0,
        events: ec,
      };
    });

    // ---- 4) TOP QUERIES ----
    const queryMap: Record<string, { count: number; sources: Set<string>; projects: Set<string> }> = {};
    for (const e of searchEvents) {
      const meta = (e.metadata as any) || {};
      const q = (meta.query || '').toLowerCase().trim();
      if (!q) continue;
      if (!queryMap[q]) queryMap[q] = { count: 0, sources: new Set(), projects: new Set() };
      queryMap[q].count++;
      if (meta.source) queryMap[q].sources.add(meta.source);
      for (const slug of (meta.projectsMatched || [])) queryMap[q].projects.add(slug);
    }
    const topQueries = Object.entries(queryMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([query, data]) => ({
        query,
        count: data.count,
        sources: Array.from(data.sources),
        projectsShown: Array.from(data.projects),
      }));

    // ---- 5) EVENT TYPE BREAKDOWN ----
    const typeCounts: Record<string, number> = {};
    for (const e of events) {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    }
    const eventBreakdown = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    return NextResponse.json({
      recentSearches,
      botHuman,
      rankingActivity,
      topQueries,
      eventBreakdown,
      period: '30d',
      totalEventsAnalyzed: events.length,
    });
  } catch (error: any) {
    console.error('Admin intelligence error:', error);
    return NextResponse.json({ error: 'Failed to load intelligence data' }, { status: 500 });
  }
}
