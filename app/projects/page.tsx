export const dynamic = "force-dynamic";

import { Metadata } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import ProjectsDirectoryClient from '@/components/projects-directory-client';
import { getRankScore, sortByPriority } from '@/lib/ranking';
import { getGeoScore } from '@/lib/geo-score';

const PAGE_SIZE = 12;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { page?: string; category?: string };
}): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('x-forwarded-host') || process.env.NEXTAUTH_URL || 'https://citablehub.com';
  const siteUrl = host.startsWith('http') ? host : `https://${host}`;
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10));
  const category = searchParams?.category || '';

  const title = page === 1
    ? 'CitableHub — Projects Directory'
    : `CitableHub — Projects · Page ${page}`;
  const description = page === 1
    ? 'Browse 100+ verified, AI-citable software projects. Ranked by trust score, relevance, and boost.'
    : `Page ${page} of the CitableHub project directory. Discover citable software solutions.`;

  const canonicalUrl = page === 1
    ? `${siteUrl}/projects`
    : `${siteUrl}/projects?page=${page}`;

  const other: Record<string, string> = {};

  // rel prev/next
  if (page > 1) {
    other['prev'] = page === 2 ? `${siteUrl}/projects` : `${siteUrl}/projects?page=${page - 1}`;
  }
  // We'll compute total in the page itself for next link

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'CitableHub',
      type: 'website',
    },
    other,
  };
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { page?: string; page_size?: string; sort?: string; category?: string; search?: string };
}) {
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10));
  const pageSize = Math.min(48, Math.max(1, parseInt(searchParams?.page_size || String(PAGE_SIZE), 10)));
  const sort = searchParams?.sort || 'rank';
  const category = searchParams?.category || '';
  const search = searchParams?.search || '';

  const headersList = headers();
  const host = headersList.get('x-forwarded-host') || process.env.NEXTAUTH_URL || 'https://citablehub.com';
  const siteUrl = host.startsWith('http') ? host : `https://${host}`;

  // Build where clause
  const where: any = {
    status: { notIn: ['rejected', 'flagged', 'draft'] },
  };
  if (category && category !== 'all') {
    where.category = category;
  }
  if (search?.trim()) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
    ];
  }

  let projects: any[] = [];
  let total = 0;

  try {
    total = await prisma.project.count({ where });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * pageSize;

    const selectFields = {
      id: true, name: true, slug: true, url: true, summary: true,
      category: true, subcategory: true, tags: true, status: true,
      claimable: true, trustScore: true, boostScore: true,
      aiReadinessScore: true, impressions: true, clicks: true,
      savesCount: true, verificationStatus: true, createdAt: true, updatedAt: true,
      isSeeded: true, platformPartner: true, logoUrl: true,
      description: true, outcome: true, targetAudience: true,
      dynamicScore: true, rankPosition: true, prevRankPosition: true,
      // fields the GEO score needs (completeness + freshness + claim)
      ownerId: true, lastReviewed: true, founderName: true, demoUrl: true,
      supportUrl: true, version: true, alternatives: true,
      _count: { select: { evidences: true } },
    };

    if (sort === 'rank') {
      const allProjects = await prisma.project.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        select: selectFields,
      });
      const sorted = sortByPriority(allProjects);
      projects = sorted.slice(skip, skip + pageSize);
    } else {
      // For non-rank sorts, still fetch all and apply priority within same sort
      let allProjects = await prisma.project.findMany({
        where,
        select: selectFields,
      });
      switch (sort) {
        case 'trust':
          allProjects.sort((a, b) => {
            const aPartner = a?.platformPartner ? 1 : 0;
            const bPartner = b?.platformPartner ? 1 : 0;
            if (bPartner !== aPartner) return bPartner - aPartner;
            return (b?.trustScore ?? 0) - (a?.trustScore ?? 0);
          });
          break;
        case 'recent':
          allProjects.sort((a, b) => {
            const aPartner = a?.platformPartner ? 1 : 0;
            const bPartner = b?.platformPartner ? 1 : 0;
            if (bPartner !== aPartner) return bPartner - aPartner;
            return new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime();
          });
          break;
        case 'boost':
          allProjects.sort((a, b) => {
            const aPartner = a?.platformPartner ? 1 : 0;
            const bPartner = b?.platformPartner ? 1 : 0;
            if (bPartner !== aPartner) return bPartner - aPartner;
            return (b?.boostScore ?? 0) - (a?.boostScore ?? 0);
          });
          break;
        default:
          allProjects = sortByPriority(allProjects);
      }
      projects = allProjects.slice(skip, skip + pageSize);
    }
  } catch (e) {
    console.error('Projects page fetch error:', e);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  // Fetch categories for filters
  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany();
  } catch {}

  // Serialize dates
  const serializedProjects = projects.map((p: any, i: number) => ({
    ...p,
    position_index: (safePage - 1) * pageSize + i + 1,
    rank_score: Math.round(getRankScore(p)),
    geo_score: getGeoScore({ ...p, evidences: Array(p?._count?.evidences ?? 0).fill({}) }).total,
    dynamicScore: p.dynamicScore ?? 0,
    rankPosition: p.rankPosition ?? 0,
    prevRankPosition: p.prevRankPosition ?? 0,
    isSeeded: p.isSeeded ?? true,
    platformPartner: p.platformPartner ?? false,
    createdAt: p.createdAt?.toISOString?.() ?? '',
    updatedAt: p.updatedAt?.toISOString?.() ?? '',
  }));

  // rel prev/next head links
  const prevUrl = safePage > 1
    ? safePage === 2 ? `${siteUrl}/projects` : `${siteUrl}/projects?page=${safePage - 1}`
    : null;
  const nextUrl = safePage < totalPages
    ? `${siteUrl}/projects?page=${safePage + 1}`
    : null;

  return (
    <>
      {/* rel prev/next for SEO */}
      {prevUrl && <link rel="prev" href={prevUrl} />}
      {nextUrl && <link rel="next" href={nextUrl} />}

      <ProjectsDirectoryClient
        projects={serializedProjects}
        categories={categories}
        total={total}
        page={safePage}
        pageSize={pageSize}
        totalPages={totalPages}
        sort={sort}
        category={category}
        search={search}
        siteUrl={siteUrl}
      />
    </>
  );
}
