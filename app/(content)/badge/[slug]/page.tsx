export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { BadgeCheck } from 'lucide-react';
import { prisma } from '@/lib/db';
import CopyButton from '@/components/copy-button';
import { resolveSiteUrl, PUBLIC_STATUS_FILTER } from '@/lib/programmatic-pages';

async function loadProject(slug: string) {
  try {
    return await prisma.project.findFirst({
      where: { slug, status: PUBLIC_STATUS_FILTER },
      select: { name: true, slug: true },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const siteUrl = resolveSiteUrl(headers());
  const project = await loadProject(params.slug);
  if (!project) return { title: 'Badge Not Found — CitableHub', robots: { index: false, follow: true } };
  const title = `Embed the Citable Verified badge for ${project.name}`;
  const description = `Copy-paste embed code to add the CitableHub Citability badge for ${project.name} to your website or README.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/badge/${project.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function BadgePage({ params }: { params: { slug: string } }) {
  const siteUrl = resolveSiteUrl(headers());
  const project = await loadProject(params.slug);
  if (!project) notFound();

  const profileUrl = `${siteUrl}/p/${project.slug}`;
  const badgeUrl = `${siteUrl}/api/badge/${project.slug}`;
  const alt = `Citable Verified — ${project.name} on CitableHub`;

  const htmlSnippet = `<a href="${profileUrl}" target="_blank" rel="noopener">\n  <img src="${badgeUrl}" alt="${alt}" height="20" />\n</a>`;
  const markdownSnippet = `[![${alt}](${badgeUrl})](${profileUrl})`;

  return (
    <div className="py-8 max-w-2xl mx-auto space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <BadgeCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">Citable Verified Badge</h1>
            <p className="text-sm text-muted-foreground">Embed {project.name}'s live citability badge on your site or README.</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The badge updates automatically as your <Link href={`/p/${project.slug}`} className="text-primary hover:underline">profile</Link> improves,
          and it links back to CitableHub — a real backlink that strengthens your AI discoverability.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">Live preview</h2>
        <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center">
          <img src={badgeUrl} alt={alt} height={20} />
        </div>
      </section>

      <Snippet title="HTML" code={htmlSnippet} />
      <Snippet title="Markdown (README)" code={markdownSnippet} />

      <p className="text-xs text-muted-foreground">
        Tip: Paste the Markdown snippet into your GitHub README, or the HTML into your website footer. Search engines and AI crawlers
        follow the link back to your verified profile.
      </p>
    </div>
  );
}

function Snippet({ title, code }: { title: string; code: string }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">{title}</h2>
        <CopyButton value={code} />
      </div>
      <pre className="bg-card border border-border rounded-xl p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap break-all">{code}</pre>
    </section>
  );
}
