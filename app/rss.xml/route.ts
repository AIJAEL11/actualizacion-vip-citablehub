export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const headersList = headers();
  const host = headersList.get('x-forwarded-host') || process.env.NEXTAUTH_URL || 'https://citablehub.com';
  const siteUrl = host.startsWith('http') ? host : `https://${host}`;

  let items = '';

  try {
    const projects = await prisma.project.findMany({
      where: { status: { notIn: ['rejected', 'flagged', 'draft'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        name: true,
        slug: true,
        summary: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    items = projects
      .map((p) => {
        const pubDate = (p.updatedAt || p.createdAt).toUTCString();
        const link = `${siteUrl}/p/${p.slug}`;
        const description = p.summary || `${p.name} — listed on CitableHub`;
        return `    <item>
      <title>${escapeXml(p.name)}</title>
      <description>${escapeXml(description)}</description>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      ${p.category ? `<category>${escapeXml(p.category)}</category>` : ''}
    </item>`;
      })
      .join('\n');
  } catch (e) {
    console.warn('RSS feed generation error:', e);
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CitableHub — AI-Discoverable Project Directory</title>
    <link>${siteUrl}</link>
    <description>The latest software and business profiles added to CitableHub, structured for AI discoverability.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
