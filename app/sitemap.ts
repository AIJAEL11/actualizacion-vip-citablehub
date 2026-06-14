import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { sortByPriority } from '@/lib/ranking';
import { comparisonSlug } from '@/lib/programmatic-pages';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = headers();
  const host = headersList.get('x-forwarded-host') || process.env.NEXTAUTH_URL || 'https://citablehub.com';
  const siteUrl = host.startsWith('http') ? host : `https://${host}`;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/projects`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/discover`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/chat`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/submit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },

    { url: `${siteUrl}/boost`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/mcp`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/scan`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  // Programmatic "Best {category}" landing pages — one per category.
  let bestRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.category.findMany({ select: { id: true } });
    bestRoutes = (categories ?? []).map((c: any) => ({
      url: `${siteUrl}/best/${c.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.warn('Sitemap best-category error:', e);
  }

  // Programmatic comparison pages among the top public projects.
  let compareRoutes: MetadataRoute.Sitemap = [];
  try {
    const rows = await prisma.project.findMany({
      where: { status: { notIn: ['rejected', 'flagged', 'draft'] } },
      select: { slug: true, dynamicScore: true, boostScore: true, isSeeded: true, platformPartner: true, trustScore: true, impressions: true, clicks: true, savesCount: true, createdAt: true },
    });
    const top = sortByPriority(rows).slice(0, 6);
    const seen = new Set<string>();
    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        const slug = comparisonSlug(top[i].slug, top[j].slug);
        if (seen.has(slug)) continue;
        seen.add(slug);
        compareRoutes.push({
          url: `${siteUrl}/compare/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        });
      }
    }
  } catch (e) {
    console.warn('Sitemap compare error:', e);
  }

  // Paginated project directory pages
  let paginatedRoutes: MetadataRoute.Sitemap = [];
  try {
    const totalProjects = await prisma.project.count({
      where: { status: { notIn: ['rejected', 'flagged', 'draft'] } },
    });
    const totalPages = Math.max(1, Math.ceil(totalProjects / PAGE_SIZE));
    const maxPagesInSitemap = Math.min(totalPages, 20);

    for (let i = 2; i <= maxPagesInSitemap; i++) {
      paginatedRoutes.push({
        url: `${siteUrl}/projects?page=${i}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }
  } catch (e) {
    console.warn('Sitemap pagination error:', e);
  }

  // Individual project pages (include invited, registered, approved, verified)
  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const projects = await prisma.project.findMany({
      where: { status: { notIn: ['rejected', 'flagged', 'draft'] } },
      select: { slug: true, updatedAt: true, status: true },
    });
    projectRoutes = (projects ?? []).map((p: any) => ({
      url: `${siteUrl}/p/${p?.slug}`,
      lastModified: p?.updatedAt ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority: p?.status === 'verified' ? 0.95 : p?.status === 'registered' ? 0.9 : 0.8,
    }));
  } catch (e) {
    console.warn('Sitemap project fetch error:', e);
  }

  return [...staticRoutes, ...bestRoutes, ...compareRoutes, ...paginatedRoutes, ...projectRoutes];
}
