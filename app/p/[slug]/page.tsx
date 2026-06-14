export const dynamic = "force-dynamic";

import { prisma } from '@/lib/db';
import { ProjectProfileClient } from '@/components/project-profile-client';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { getGeoScore } from '@/lib/geo-score';
import { resolveSiteUrl, scoreColor, scoreBand } from '@/lib/programmatic-pages';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('x-forwarded-host') || 'citablehub.com';
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const siteUrl = `${protocol}://${host}`;

  let project: any = null;
  try {
    project = await prisma.project.findFirst({ where: { slug: params?.slug } });
  } catch {}

  if (!project) {
    return { title: 'Project Not Found — CitableHub' };
  }

  const title = `${project.name} — CitableHub Verified Profile`;
  const description = project.summary || project.description || `${project.name} on CitableHub. Verified software with citable evidence.`;
  const url = `${siteUrl}/p/${project.slug}`;
  const ogImage = `${siteUrl}/api/og/${project.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'CitableHub',
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: project.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProjectProfilePage({ params }: { params: { slug: string } }) {
  let project: any = null;
  try {
    project = await prisma.project.findFirst({
      where: { slug: params?.slug },
      include: { evidences: true, projectUpdates: true },
    }) as any;
  } catch (e) {
    console.warn('Failed to load project:', e);
  }

  if (!project) {
    notFound();
  }

  // Increment impressions
  try {
    await prisma.project.update({
      where: { id: project.id },
      data: { impressions: { increment: 1 } },
    });
  } catch {}

  const serialized = {
    ...(project ?? {}),
    createdAt: project?.createdAt?.toISOString?.() ?? '',
    updatedAt: project?.updatedAt?.toISOString?.() ?? '',
    launchDate: (project as any)?.launchDate?.toISOString?.() ?? null,
    lastReviewed: (project as any)?.lastReviewed?.toISOString?.() ?? null,
    evidences: (project?.evidences ?? []).map((e: any) => ({
      ...(e ?? {}),
      createdAt: e?.createdAt?.toISOString?.() ?? '',
    })),
    projectUpdates: (project?.projectUpdates ?? []).map((u: any) => ({
      ...(u ?? {}),
      createdAt: u?.createdAt?.toISOString?.() ?? '',
    })),
  };

  // ── Server-rendered GEO layer (crawlable without JavaScript) ──────────────
  const siteUrl = resolveSiteUrl(headers());
  const name = serialized.name || 'This tool';
  const summary = (serialized.summary || serialized.description || `${name} is listed on CitableHub.`).toString().trim();
  const geoBreakdown = getGeoScore(serialized);
  const geo = geoBreakdown.total;
  const verified = serialized.verificationStatus === 'verified' || serialized.status === 'verified';
  const profileUrl = `${siteUrl}/p/${serialized.slug}`;
  const lastVerifiedIso = (serialized.lastReviewed || serialized.updatedAt || '').toString();
  const lastVerifiedDate = lastVerifiedIso ? lastVerifiedIso.slice(0, 10) : 'pending';
  const audience = (serialized.targetAudience || '').toString().trim();
  const description = (serialized.description || summary).toString().trim();

  const faqs = [
    { q: `What is ${name}?`, a: summary },
    { q: `What does ${name} do?`, a: description.slice(0, 320) },
    { q: `Who is ${name} for?`, a: audience || `${name} is listed in the ${serialized.category || 'software'} category on CitableHub.` },
    {
      q: `Is ${name} verified?`,
      a: verified
        ? `Yes — ${name} is verified on CitableHub. Last verified ${lastVerifiedDate}. GEO score ${geo}/100.`
        : `${name} is listed on CitableHub with a GEO (Generative Engine Optimization) score of ${geo}/100.`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Projects', item: `${siteUrl}/projects` },
          { '@type': 'ListItem', position: 3, name, item: profileUrl },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name,
        url: serialized.url,
        applicationCategory: serialized.category || 'BusinessApplication',
        operatingSystem: 'Web',
        description: summary,
        ...(serialized.logoUrl ? { image: serialized.logoUrl } : {}),
        ...(lastVerifiedIso ? { dateModified: lastVerifiedIso } : {}),
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'GEO Score', value: geo },
          { '@type': 'PropertyValue', name: 'lastVerified', value: lastVerifiedDate },
          { '@type': 'PropertyValue', name: 'verificationStatus', value: verified ? 'verified' : (serialized.status || 'listed') },
        ],
        isPartOf: { '@type': 'WebSite', name: 'CitableHub', url: siteUrl },
        provider: { '@type': 'Organization', name: 'CitableHub', url: siteUrl },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
      {
        '@type': 'WebPage',
        name: `${name} — CitableHub Verified Profile`,
        url: profileUrl,
        ...(lastVerifiedIso ? { dateModified: lastVerifiedIso } : {}),
        isPartOf: { '@type': 'WebSite', name: 'CitableHub', url: siteUrl },
        inLanguage: 'en',
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Answer-first summary — server-rendered so AI crawlers read it without JS.
          The first sentence is a direct, quotable definition an assistant can cite. */}
      <section className="max-w-4xl mx-auto px-4 pt-6">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
              <Sparkles className="h-3.5 w-3.5" /> Answer-first summary
            </span>
            <span className="font-mono font-black text-lg" style={{ color: scoreColor(geo) }}>
              {geo}<span className="text-xs text-muted-foreground">/100 GEO</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight">{name}</h1>
          <p className="text-sm text-foreground leading-relaxed">{summary}</p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {serialized.category && <span className="bg-card border border-border rounded-full px-2.5 py-1 font-mono">{serialized.category}</span>}
            <span className="bg-card border border-border rounded-full px-2.5 py-1">{scoreBand(geo)} citability</span>
            {verified && (
              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full px-2.5 py-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified {lastVerifiedDate}
              </span>
            )}
            <a href={serialized.url} rel="noopener" className="bg-card border border-border rounded-full px-2.5 py-1 hover:text-primary transition">Visit site →</a>
          </div>
        </div>
      </section>

      {/* Citability score breakdown — for the owner; converts the score into an incentive. */}
      <section className="max-w-4xl mx-auto px-4 pt-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-display">Your Citability Score</h2>
            <span className="font-mono font-black" style={{ color: scoreColor(geo) }}>{geo}<span className="text-xs text-muted-foreground">/100</span></span>
          </div>
          <div className="space-y-3">
            {geoBreakdown.factors.map((f) => {
              const pct = Math.round((f.score / f.max) * 100);
              return (
                <div key={f.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{f.label}</span>
                    <span className="font-mono" style={{ color: scoreColor(pct) }}>{f.score}/{f.max}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: scoreColor(pct) }} />
                  </div>
                </div>
              );
            })}
          </div>
          {geoBreakdown.factors.some((f) => f.score < f.max) && (
            <div className="border-t border-border pt-3 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">What to improve to rank higher</div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {geoBreakdown.factors.filter((f) => f.score < f.max).map((f) => (
                  <li key={f.key}><span className="font-semibold text-foreground">{f.label}:</span> {f.hint}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Promotion (Boost) does not change this score — it only changes ordering. This number reflects real, verifiable citability.</p>
        </div>
      </section>

      <ProjectProfileClient project={serialized} />
    </>
  );
}
