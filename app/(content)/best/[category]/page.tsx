export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Trophy, ArrowUpRight, GitCompareArrows } from 'lucide-react';
import { prisma } from '@/lib/db';
import { sortByPriority } from '@/lib/ranking';
import { resolveSiteUrl, comparisonSlug, PUBLIC_STATUS_FILTER } from '@/lib/programmatic-pages';

const TOP_N = 24;

const SELECT = {
  id: true, name: true, slug: true, url: true, summary: true, category: true,
  tags: true, outcome: true, targetAudience: true, logoUrl: true,
  trustScore: true, boostScore: true, dynamicScore: true, isSeeded: true,
  platformPartner: true, verificationStatus: true, status: true, createdAt: true,
};

async function loadCategory(id: string) {
  try {
    return await prisma.category.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

async function loadProjects(categoryId: string) {
  try {
    const rows = await prisma.project.findMany({
      where: { category: categoryId, status: PUBLIC_STATUS_FILTER },
      select: SELECT,
    });
    return sortByPriority(rows).slice(0, TOP_N);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const siteUrl = resolveSiteUrl(headers());
  const category = await loadCategory(params.category);
  if (!category) return { title: 'Category Not Found — CitableHub', robots: { index: false, follow: true } };

  const title = `Best ${category.name} Tools (2026) — CitableHub`;
  const description = `A curated, AI-citable ranking of the best ${category.name.toLowerCase()} tools. ${category.description} Verified profiles with structured evidence, updated continuously.`;
  const url = `${siteUrl}/best/${category.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'CitableHub', type: 'website' },
    robots: { index: true, follow: true },
  };
}

export default async function BestCategoryPage({ params }: { params: { category: string } }) {
  const siteUrl = resolveSiteUrl(headers());
  const category = await loadCategory(params.category);
  if (!category) notFound();

  const projects = await loadProjects(category.id);
  const top = projects.slice(0, 10);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Best ${category.name} Tools`,
    url: `${siteUrl}/best/${category.id}`,
    description: `Curated ranking of the best ${category.name} tools on CitableHub.`,
    isPartOf: { '@type': 'WebSite', name: 'CitableHub', url: siteUrl },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Projects', item: `${siteUrl}/projects` },
        { '@type': 'ListItem', position: 3, name: `Best ${category.name}`, item: `${siteUrl}/best/${category.id}` },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: projects.length,
      itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: `${siteUrl}/p/${p.slug}`,
      })),
    },
  };

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Link href="/" className="hover:text-primary">Home</Link><span>/</span>
        <Link href="/projects" className="hover:text-primary">Projects</Link><span>/</span>
        <span className="text-foreground">Best {category.name}</span>
      </nav>

      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-amber-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">Best {category.name} Tools</h1>
        </div>
        <p className="text-base text-muted-foreground leading-relaxed">
          {projects.length > 0 ? (
            <>The <strong className="text-foreground">{projects.length} most citable {category.name.toLowerCase()} tools</strong> on CitableHub, ranked by verified evidence, trust signals, and engagement. {category.description} Every entry has a structured, AI-readable profile that assistants like ChatGPT and Perplexity can cite directly.</>
          ) : (
            <>{category.description} No projects are listed in this category yet — <Link href="/submit" className="text-primary hover:underline">be the first to list one free</Link>.</>
          )}
        </p>
      </header>

      {top.length >= 2 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
            <GitCompareArrows className="h-3.5 w-3.5" /> Head-to-head comparisons
          </h2>
          <div className="flex flex-wrap gap-2">
            {buildPairs(top.slice(0, 3)).map(([a, b]) => (
              <Link
                key={`${a.slug}-${b.slug}`}
                href={`/compare/${comparisonSlug(a.slug, b.slug)}`}
                className="text-xs bg-card border border-border rounded-full px-3 py-1.5 hover:border-primary/40 hover:text-primary transition"
              >
                {a.name} vs {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <ol className="space-y-3">
        {projects.map((p, i) => (
          <li key={p.id}>
            <Link
              href={`/p/${p.slug}`}
              className="group flex items-start gap-4 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted text-foreground font-bold font-mono flex items-center justify-center text-sm">{i + 1}</div>
              {p.logoUrl ? (
                <img src={p.logoUrl} alt={p.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">{p.name?.charAt(0)?.toUpperCase()}</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm font-display truncate group-hover:text-primary transition">{p.name}</h3>
                  {p.platformPartner && <span className="text-[9px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">Partner</span>}
                  {p.verificationStatus === 'verified' && <span className="text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">Verified</span>}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.summary}</p>
                {Array.isArray(p.tags) && p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.tags.slice(0, 4).map((t: string) => (
                      <span key={t} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition flex-shrink-0" />
            </Link>
          </li>
        ))}
      </ol>

      <div className="text-center pt-4">
        <Link href="/projects" className="text-sm text-primary hover:underline font-semibold">Browse the full CitableHub directory →</Link>
      </div>
    </div>
  );
}

function buildPairs<T>(items: T[]): [T, T][] {
  const pairs: [T, T][] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
}
