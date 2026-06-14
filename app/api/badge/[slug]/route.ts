import { prisma } from '@/lib/db';
import { getAllSubScores } from '@/lib/citability-scores';
import { scoreColor, PUBLIC_STATUS_FILTER } from '@/lib/programmatic-pages';

export const dynamic = 'force-dynamic';

/**
 * Dynamic "Citable Verified" SVG badge for a project, served at
 * /api/badge/[slug]. Owners embed it on their own site, which links back to
 * the project's CitableHub profile — generating backlinks and crawl signals.
 * Brand + numeric score only (no user-controlled text) to keep the SVG safe.
 */
const FONT = 'Verdana,Geneva,DejaVu Sans,sans-serif';

function estWidth(text: string): number {
  // Rough average glyph width at 11px for the fonts above.
  return Math.ceil(text.length * 6.5) + 20;
}

function badgeSvg(label: string, value: string, color: string): string {
  const labelW = estWidth(label);
  const valueW = estWidth(value);
  const total = labelW + valueW;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#1f2937"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${color}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="${FONT}" font-size="11">
    <text x="${labelW / 2}" y="14">${label}</text>
    <text x="${labelW + valueW / 2}" y="14" font-weight="bold">${value}</text>
  </g>
</svg>`;
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  let project: any = null;
  try {
    project = await prisma.project.findFirst({
      where: { slug: params?.slug, status: PUBLIC_STATUS_FILTER },
      include: { evidences: true },
    });
  } catch {}

  if (!project) {
    const svg = badgeSvg('CitableHub', 'unknown', '#6B7280');
    return new Response(svg, {
      status: 404,
      headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
    });
  }

  const overall = getAllSubScores(project).overall;
  const svg = badgeSvg('Citable', `${overall}/100`, scoreColor(overall));

  // Fire-and-forget: count badge embeds rendering in the wild (backlink signal).
  prisma.analyticsEvent
    .create({ data: { type: 'badge_impression', projectId: project.id, metadata: { slug: params?.slug } } })
    .catch(() => {});

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Short cache so the badge reflects profile improvements within the hour.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
