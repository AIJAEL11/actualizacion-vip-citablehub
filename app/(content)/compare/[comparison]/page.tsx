export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { GitCompareArrows, Check, Minus, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getAllSubScoreDetails, getAllSubScores } from '@/lib/citability-scores';
import { resolveSiteUrl, parseComparison, scoreColor, scoreBand, PUBLIC_STATUS_FILTER } from '@/lib/programmatic-pages';

async function loadProject(slug: string) {
  try {
    return await prisma.project.findFirst({
      where: { slug, status: PUBLIC_STATUS_FILTER },
      include: { evidences: true },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { comparison: string } }): Promise<Metadata> {
  const siteUrl = resolveSiteUrl(headers());
  const parsed = parseComparison(params.comparison);
  if (!parsed) return { title: 'Comparison Not Found — CitableHub', robots: { index: false, follow: true } };

  const [a, b] = await Promise.all([loadProject(parsed.slugA), loadProject(parsed.slugB)]);
  if (!a || !b) return { title: 'Comparison Not Found — CitableHub', robots: { index: false, follow: true } };

  const title = `${a.name} vs ${b.name}: Citability Comparison — CitableHub`;
  const description = `${a.name} vs ${b.name} compared across five AI-citability dimensions — Identity, Evidence, Trust, Freshness, and Classification. See which structured profile AI search engines can cite more confidently.`;
  const url = `${siteUrl}/compare/${parsed.slugA}-vs-${parsed.slugB}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'CitableHub', type: 'website' },
    robots: { index: true, follow: true },
  };
}

export default async function ComparePage({ params }: { params: { comparison: string } }) {
  const siteUrl = resolveSiteUrl(headers());
  const parsed = parseComparison(params.comparison);
  if (!parsed) notFound();

  const [a, b] = await Promise.all([loadProject(parsed.slugA), loadProject(parsed.slugB)]);
  if (!a || !b) notFound();

  const aDetails = getAllSubScoreDetails(a);
  const bDetails = getAllSubScoreDetails(b);
  const aOverall = getAllSubScores(a).overall;
  const bOverall = getAllSubScores(b).overall;

  const softwareApp = (p: any, overall: number) => ({
    '@type': 'SoftwareApplication',
    name: p.name,
    url: p.url,
    applicationCategory: p.category,
    description: p.summary,
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    additionalProperty: { '@type': 'PropertyValue', name: 'CitabilityScore', value: overall },
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${a.name} vs ${b.name} — Citability Comparison`,
    url: `${siteUrl}/compare/${parsed.slugA}-vs-${parsed.slugB}`,
    isPartOf: { '@type': 'WebSite', name: 'CitableHub', url: siteUrl },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Projects', item: `${siteUrl}/projects` },
        { '@type': 'ListItem', position: 3, name: `${a.name} vs ${b.name}`, item: `${siteUrl}/compare/${parsed.slugA}-vs-${parsed.slugB}` },
      ],
    },
    about: [softwareApp(a, aOverall), softwareApp(b, bOverall)],
  };

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Link href="/" className="hover:text-primary">Home</Link><span>/</span>
        <Link href="/projects" className="hover:text-primary">Projects</Link><span>/</span>
        <span className="text-foreground">{a.name} vs {b.name}</span>
      </nav>

      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GitCompareArrows className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">{a.name} <span className="text-muted-foreground font-normal">vs</span> {b.name}</h1>
        </div>
        <p className="text-base text-muted-foreground leading-relaxed">
          {a.name} and {b.name} compared across the five dimensions of AI citability. The higher a profile scores, the more confidently
          AI search engines can identify, trust, and cite it. Scores reflect only verifiable profile data — no fabricated ratings.
        </p>
      </header>

      {/* Overall cards */}
      <div className="grid grid-cols-2 gap-4">
        {[{ p: a, overall: aOverall, slug: parsed.slugA }, { p: b, overall: bOverall, slug: parsed.slugB }].map(({ p, overall, slug }) => (
          <div key={slug} className="bg-card border border-border rounded-2xl p-5 space-y-3 text-center">
            {p.logoUrl ? (
              <img src={p.logoUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover mx-auto" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mx-auto">{p.name?.charAt(0)?.toUpperCase()}</div>
            )}
            <div>
              <h2 className="font-bold font-display">{p.name}</h2>
              <p className="text-xs text-muted-foreground line-clamp-2">{p.summary}</p>
            </div>
            <div className="font-mono font-black text-3xl" style={{ color: scoreColor(overall) }}>{overall}<span className="text-sm text-muted-foreground">/100</span></div>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: scoreColor(overall) }}>{scoreBand(overall)} citability</div>
            <Link href={`/p/${slug}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">View profile <ExternalLink className="h-3 w-3" /></Link>
          </div>
        ))}
      </div>

      {/* Dimension table */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-display">Dimension-by-dimension</h2>
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground font-mono">
                <th className="text-left font-semibold px-4 py-3">Dimension</th>
                <th className="text-center font-semibold px-4 py-3">{a.name}</th>
                <th className="text-center font-semibold px-4 py-3">{b.name}</th>
              </tr>
            </thead>
            <tbody>
              {aDetails.map((dim, i) => {
                const av = dim.score;
                const bv = bDetails[i].score;
                return (
                  <tr key={dim.label} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{dim.label}</td>
                    <td className="px-4 py-3 text-center"><ScoreCell value={av} winner={av > bv} /></td>
                    <td className="px-4 py-3 text-center"><ScoreCell value={bv} winner={bv > av} /></td>
                  </tr>
                );
              })}
              <tr className="border-t border-border bg-muted/30 font-bold">
                <td className="px-4 py-3">Overall</td>
                <td className="px-4 py-3 text-center"><ScoreCell value={aOverall} winner={aOverall > bOverall} /></td>
                <td className="px-4 py-3 text-center"><ScoreCell value={bOverall} winner={bOverall > aOverall} /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          A higher score means a more complete, verifiable, and AI-citable profile. Both products can improve their score by adding
          evidence links, contact and legal URLs, and keeping their listing fresh.
        </p>
      </section>

      <div className="text-center pt-2">
        <Link href="/projects" className="text-sm text-primary hover:underline font-semibold">Compare more tools in the directory →</Link>
      </div>
    </div>
  );
}

function ScoreCell({ value, winner }: { value: number; winner: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono font-bold" style={{ color: scoreColor(value) }}>
      {winner ? <Check className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5 opacity-40" />}
      {value}
    </span>
  );
}
