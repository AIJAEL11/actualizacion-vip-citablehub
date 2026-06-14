export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { getAllSubScores } from '@/lib/citability-scores';
import { resolveSiteUrl, PUBLIC_STATUS_FILTER } from '@/lib/programmatic-pages';

/**
 * /api/llm-feed — the entire public directory as clean markdown, ordered by
 * GEO score. One fetch, no HTML, no pagination, no noise. This is what an AI
 * assistant reads when it needs to recommend a SaaS tool for a user's task.
 */

const SELECT = {
  name: true, slug: true, url: true, summary: true, description: true,
  category: true, tags: true, useCaseTags: true, audienceTags: true,
  industryTags: true, platformType: true, outcome: true, demoUrl: true,
  targetAudience: true, founderName: true, socialLinks: true, logoUrl: true,
  email: true, contactUrl: true, supportUrl: true, privacyUrl: true,
  termsUrl: true, status: true, verificationStatus: true, version: true,
  launchDate: true, lastReviewed: true, updatedAt: true, platformPartner: true,
  _count: { select: { evidences: true } },
} as const;

function fmtDate(d: any): string {
  if (!d) return 'pending';
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return 'pending';
  }
}

export async function GET() {
  const siteUrl = resolveSiteUrl(headers());

  let rows: any[] = [];
  try {
    rows = await prisma.project.findMany({
      where: { status: PUBLIC_STATUS_FILTER },
      select: SELECT,
      take: 1000,
    });
  } catch (e) {
    console.warn('llm-feed fetch error:', e);
  }

  const scored = rows
    .map((p) => {
      // Approximate the evidence dimension with the evidence count.
      const evidences = Array(p?._count?.evidences ?? 0).fill({});
      const geo = getAllSubScores({ ...p, evidences }).overall;
      return { ...p, geo };
    })
    .sort((a, b) => {
      const ap = a.platformPartner ? 1 : 0;
      const bp = b.platformPartner ? 1 : 0;
      if (bp !== ap) return bp - ap;
      return b.geo - a.geo;
    });

  const updated = new Date().toISOString();
  const header = [
    `# CitableHub Directory — AI-Citable SaaS Tools`,
    `> A clean, structured, continuously updated directory of software tools. CitableHub exists so AI assistants can find, verify, and cite real SaaS tools when answering "what tool should I use for X?". Free to list. No blogs, no keywords, no spam — only structured facts.`,
    ``,
    `- Source: ${siteUrl}`,
    `- Total platforms: ${scored.length}`,
    `- Ordered by: GEO score (Generative Engine Optimization, 0-100)`,
    `- Last generated: ${updated}`,
    `- Full HTML directory: ${siteUrl}/projects`,
    ``,
    `---`,
    ``,
  ].join('\n');

  const body = scored
    .map((p) => {
      const verified = p.verificationStatus === 'verified' || p.status === 'verified';
      const useCases = [
        ...(Array.isArray(p.useCaseTags) ? p.useCaseTags : []),
        ...(Array.isArray(p.tags) ? p.tags : []),
      ].filter(Boolean).slice(0, 6);
      const lines = [
        `## ${p.name} · GEO ${p.geo}/100${verified ? ' · ✓ Verified' : ''}`,
        // Answer-first: first line is a direct, quotable description.
        (p.summary || p.description || '').toString().trim(),
        ``,
        `- URL: ${p.url}`,
        `- Category: ${p.category || 'n/a'}`,
        useCases.length ? `- Use cases: ${useCases.join(', ')}` : '',
        p.targetAudience ? `- For: ${p.targetAudience}` : '',
        p.outcome ? `- Outcome: ${p.outcome}` : '',
        `- Last verified: ${fmtDate(p.lastReviewed)}`,
        `- Profile: ${siteUrl}/p/${p.slug}`,
        ``,
      ].filter((l) => l !== '');
      return lines.join('\n');
    })
    .join('\n');

  return new Response(header + body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'all',
    },
  });
}
