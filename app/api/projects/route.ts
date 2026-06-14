export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Generate persistent CH-VER ID
function generateCHVerId(id: string): string {
  const hash = id.replace(/[^a-zA-Z0-9]/g, '');
  const num = parseInt(hash.slice(-6), 36) || 0;
  return `CH-VER-${String(num % 1000000).padStart(6, '0')}`;
}

import { getRankScore, sortByPriority } from '@/lib/ranking';
import { getGeoScore } from '@/lib/geo-score';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(48, Math.max(1, parseInt(searchParams.get('page_size') || '12', 10)));
    const sort = searchParams.get('sort') || 'rank';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Build where clause
    const where: any = {
      status: { notIn: ['rejected', 'flagged', 'draft'] },
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search?.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Track directory search queries (fire-and-forget)
    if (search?.trim()) {
      prisma.analyticsEvent.create({
        data: {
          type: 'search_query',
          metadata: {
            query: search.slice(0, 500),
            source: 'directory',
            category: category || null,
            ua: (request.headers.get('user-agent') || '').slice(0, 200),
          },
        },
      }).catch(() => {});
    }

    // Get total count
    const total = await prisma.project.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * pageSize;

    // Determine ordering
    let orderBy: any;
    switch (sort) {
      case 'trust':
        orderBy = [{ trustScore: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'recent':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'boost':
        orderBy = [{ boostScore: 'desc' }, { trustScore: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'name':
        orderBy = [{ name: 'asc' }];
        break;
      case 'rank':
      default:
        // For rank, we fetch all and sort in-memory (composite score)
        orderBy = [{ trustScore: 'desc' }, { createdAt: 'desc' }];
        break;
    }

    let projects: any[];

    if (sort === 'rank') {
      // Rank requires in-memory sorting due to composite formula
      const allProjects = await prisma.project.findMany({
        where,
        orderBy: [{ trustScore: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true, name: true, slug: true, url: true, summary: true,
          description: true, category: true, subcategory: true, tags: true,
          status: true, claimable: true, trustScore: true, boostScore: true,
          aiReadinessScore: true, impressions: true, clicks: true,
          savesCount: true, gqiEarned: true, verificationStatus: true,
          logoUrl: true, createdAt: true, updatedAt: true,
          isSeeded: true, platformPartner: true,
          dynamicScore: true, rankPosition: true, prevRankPosition: true,
          outcome: true, targetAudience: true,
          ownerId: true, lastReviewed: true, founderName: true, demoUrl: true,
          supportUrl: true, version: true, alternatives: true,
          _count: { select: { evidences: true } },
        },
      });

      // Sort using priority system (partners > boost > real > seeded, then dynamicScore)
      const sorted = sortByPriority(allProjects);
      allProjects.length = 0;
      allProjects.push(...sorted);

      projects = allProjects.slice(skip, skip + pageSize);
    } else {
      projects = await prisma.project.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true, name: true, slug: true, url: true, summary: true,
          description: true, category: true, subcategory: true, tags: true,
          status: true, claimable: true, trustScore: true, boostScore: true,
          aiReadinessScore: true, impressions: true, clicks: true,
          savesCount: true, gqiEarned: true, verificationStatus: true,
          logoUrl: true, createdAt: true, updatedAt: true,
          isSeeded: true, platformPartner: true,
          dynamicScore: true, rankPosition: true, prevRankPosition: true,
          outcome: true, targetAudience: true,
          ownerId: true, lastReviewed: true, founderName: true, demoUrl: true,
          supportUrl: true, version: true, alternatives: true,
          _count: { select: { evidences: true } },
        },
      });
    }

    // Add position_index and rank_score
    const projectsWithMeta = projects.map((p: any, i: number) => ({
      ...p,
      position_index: skip + i + 1,
      rank_score: Math.round(getRankScore(p)),
      geo_score: getGeoScore({ ...p, evidences: Array(p?._count?.evidences ?? 0).fill({}) }).total,
      dynamicScore: p.dynamicScore ?? 0,
      rankPosition: p.rankPosition ?? 0,
      prevRankPosition: p.prevRankPosition ?? 0,
      isSeeded: p.isSeeded ?? true,
      platformPartner: p.platformPartner ?? false,
      badge: p.boostScore > 0 ? 'boosted' : p.status,
      createdAt: p.createdAt?.toISOString?.() ?? '',
      updatedAt: p.updatedAt?.toISOString?.() ?? '',
    }));

    const hasNext = safePage < totalPages;
    const hasPrev = safePage > 1;

    // Build next/prev URLs
    const baseUrl = '/api/projects';
    const buildUrl = (p: number) => {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('page_size', String(pageSize));
      if (sort !== 'rank') params.set('sort', sort);
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      return `${baseUrl}?${params.toString()}`;
    };

    return NextResponse.json({
      projects: projectsWithMeta,
      total,
      page: safePage,
      page_size: pageSize,
      total_pages: totalPages,
      has_next: hasNext,
      has_prev: hasPrev,
      next_page: hasNext ? safePage + 1 : null,
      prev_page: hasPrev ? safePage - 1 : null,
      next_page_url: hasNext ? buildUrl(safePage + 1) : null,
      prev_page_url: hasPrev ? buildUrl(safePage - 1) : null,
    });
  } catch (error: any) {
    console.error('Projects GET error:', error);
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, url, email, summary, description, outcome, targetAudience, category, tags, evidences, logoUrl, coverUrl,
      founderName, demoUrl, supportUrl, privacyUrl, termsUrl, contactUrl, version, alternatives, differentiators,
      platformType, businessType, socialLinks, notIdealFor, useCaseTags, audienceTags, industryTags,
    } = body ?? {};

    if (!name || !url || !summary || !description || !outcome) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const slug = (name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const project = await prisma.project.create({
      data: {
        name,
        slug,
        url,
        email: email || session.user.email,
        summary,
        description,
        outcome,
        targetAudience: targetAudience || '',
        category: category || 'developer-tools',
        tags: tags || [],
        status: 'submitted',
        chVerId: generateCHVerId(slug + Date.now().toString(36)),
        logoUrl: logoUrl || null,
        coverUrl: coverUrl || null,
        ownerId: user.id,
        // Trust & positioning fields
        ...(founderName ? { founderName } : {}),
        ...(demoUrl ? { demoUrl } : {}),
        ...(supportUrl ? { supportUrl } : {}),
        ...(privacyUrl ? { privacyUrl } : {}),
        ...(termsUrl ? { termsUrl } : {}),
        ...(contactUrl ? { contactUrl } : {}),
        ...(version ? { version } : {}),
        ...(platformType ? { platformType } : {}),
        ...(businessType ? { businessType } : {}),
        ...(notIdealFor ? { notIdealFor } : {}),
        ...(socialLinks ? { socialLinks } : {}),
        ...(alternatives?.length ? { alternatives } : {}),
        ...(differentiators?.length ? { differentiators } : {}),
        ...(useCaseTags?.length ? { useCaseTags } : {}),
        ...(audienceTags?.length ? { audienceTags } : {}),
        ...(industryTags?.length ? { industryTags } : {}),
        evidences: {
          create: (evidences ?? []).map((e: any) => ({
            title: e?.title || 'Evidence',
            type: e?.type || 'url',
            content: e?.content || '',
            verified: false,
          })),
        },
      },
      include: { evidences: true },
    });

    // Fire-and-forget: trigger notifications for new project
    (async () => {
      try {
        const { triggerCompletenessReminder, triggerBoostEducation } = await import('@/lib/notifications');
        await triggerCompletenessReminder(user.id, user.email, project);
        // Boost education after first project (delayed feel)
        const projectCount = await prisma.project.count({ where: { ownerId: user.id } });
        if (projectCount <= 2) {
          await triggerBoostEducation(user.id, user.email, project.name, project.id);
        }
      } catch (e) { console.error('[Notif trigger] new project:', e); }
    })();

    // Fire-and-forget: notify IndexNow about new profile
    import('@/lib/indexnow').then(({ notifyProjectChange }) =>
      notifyProjectChange(slug)
    ).catch((e) => console.error('[IndexNow] create hook error:', e));

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('Project create error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create project' }, { status: 500 });
  }
}
