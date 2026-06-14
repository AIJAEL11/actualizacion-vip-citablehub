export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Sparkles, Target, Layers, Search, ShieldCheck, Zap, Building2 } from 'lucide-react';
import { FAQ_ITEMS } from '@/lib/faq-data';
import { resolveSiteUrl } from '@/lib/programmatic-pages';

const CITABILITY_DIMENSIONS = [
  { name: 'Identity', desc: 'Name, canonical URL, logo, summary, founder, and verified social links — so an AI can resolve exactly which entity you are.' },
  { name: 'Evidence', desc: 'A citable outcome statement, proof links, a live demo, and a substantive description — the facts an AI can quote.' },
  { name: 'Trust', desc: 'Contact details, support and legal URLs, and verification status that signal the entity is real and accountable.' },
  { name: 'Freshness', desc: 'Version, launch date, last-reviewed date, and recent updates that tell an AI the information is current.' },
  { name: 'Classification', desc: 'Category, tags, use cases, audience, and platform type so your project surfaces for the right questions.' },
];

const STEPS = [
  { title: 'List your project free', desc: 'Add your name, URL, and a short summary. Our AI autofills structured fields — description, tags, audience — in about ten minutes.' },
  { title: 'Get a machine-readable profile', desc: 'CitableHub generates a JSON-LD profile (SoftwareApplication + Organization) at a permanent, crawlable URL that AI bots are explicitly allowed to index.' },
  { title: 'See your Citability Score', desc: 'Five dimensions — Identity, Evidence, Trust, Freshness, Classification — score 0-100 each, with a checklist of exactly what to improve.' },
  { title: 'Promote and (optionally) boost', desc: 'Use the personalized promotion checklist with ready-to-paste copy. Optionally buy a one-time GQI Boost for a temporary visibility lift.' },
];

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = resolveSiteUrl(headers());
  const title = 'About CitableHub — Entity Resolution for AI Search';
  const description =
    'CitableHub is a free AI-visibility platform that turns software projects into structured, machine-readable profiles so ChatGPT, Perplexity, Claude, and Google AI Overview can discover and cite them. Learn how it works.';
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/about` },
    openGraph: { title, description, url: `${siteUrl}/about`, siteName: 'CitableHub', type: 'website', images: [`${siteUrl}/logo.png`] },
    twitter: { card: 'summary_large_image', title, description, images: [`${siteUrl}/logo.png`] },
    robots: { index: true, follow: true },
  };
}

export default function AboutPage() {
  const siteUrl = resolveSiteUrl(headers());

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About CitableHub',
      url: `${siteUrl}/about`,
      description:
        'CitableHub is a free AI-visibility platform that structures software projects as machine-readable profiles so AI search engines can discover and cite them.',
      isPartOf: { '@type': 'WebSite', name: 'CitableHub', url: siteUrl },
      inLanguage: 'en',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'About', item: `${siteUrl}/about` },
        ],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'CitableHub',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      description: 'A free AI-visibility platform that helps digital products get discovered and cited by AI search engines.',
      email: 'team@citablehub.com',
      foundingDate: '2026',
      parentOrganization: { '@type': 'Organization', name: 'Wildverse LLC', url: 'https://wildverse.io' },
      sameAs: ['https://wildverse.io'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      name: 'AI Visibility & Citability Glossary',
      url: `${siteUrl}/about`,
      hasDefinedTerm: [
        {
          '@type': 'DefinedTerm',
          name: 'Generative Engine Optimization (GEO)',
          description:
            'The practice of structuring information so that generative AI engines cite it in their answers — the AI-era counterpart to SEO. GEO optimizes for being the trusted, quotable source inside an AI-generated response.',
          inDefinedTermSet: `${siteUrl}/about`,
        },
        {
          '@type': 'DefinedTerm',
          name: 'Generative Query Index (GQI)',
          description:
            'A measure of how likely a project is to be cited by AI systems when users ask relevant questions. A higher GQI means more organic visibility across ChatGPT, Perplexity, Google AI Overview, and other AI assistants.',
          inDefinedTermSet: `${siteUrl}/about`,
        },
        {
          '@type': 'DefinedTerm',
          name: 'Citability',
          description:
            'How easily an AI system can identify, trust, and quote a source. On CitableHub, citability is scored 0-100 across five dimensions: Identity, Evidence, Trust, Freshness, and Classification.',
          inDefinedTermSet: `${siteUrl}/about`,
        },
      ],
    },
  ];

  return (
    <article className="py-8 max-w-3xl mx-auto space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero / answer-first */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">About CitableHub</h1>
        </div>
        <p className="text-base text-muted-foreground leading-relaxed">
          <strong className="text-foreground">CitableHub is a free AI-visibility platform.</strong> It turns software products, apps, and
          tools into structured, machine-readable profiles so AI search engines — ChatGPT, Perplexity, Claude, Gemini, and Google AI
          Overview — can discover, understand, and cite them. CitableHub is not a traditional directory; it is an
          <strong className="text-foreground"> entity resolution platform for AI systems</strong>.
        </p>
        <p className="text-base text-foreground leading-relaxed border-l-2 border-primary pl-4 italic">
          CitableHub is the only free directory designed for LLMs to find and recommend your SaaS. No blogs, no keywords, no budget —
          you just register and you’re visible.
        </p>
      </header>

      <Section icon={Target} title="Why CitableHub exists">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Search is shifting from a list of blue links to direct, AI-generated answers. When someone asks an assistant for "the best
          tool to do X," the AI cites a small set of sources it can confidently resolve and trust. Most great products are invisible
          to that process: their information lives in JavaScript-heavy pages, lacks structured data, and gives an AI nothing concrete
          to quote. CitableHub fixes the missing layer — verifiable identity and evidence in a format machines can read.
        </p>
      </Section>

      <Section icon={Search} title="What is Generative Engine Optimization (GEO)?">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Generative Engine Optimization (GEO) is the practice of structuring information so that generative AI engines cite it in their
          answers — the AI-era counterpart to SEO. Where SEO optimizes for ranking in a results page, GEO optimizes for being the
          trusted, quotable source inside an AI-generated response. CitableHub applies GEO automatically: JSON-LD schema, an
          <code className="px-1 text-primary"> llms.txt</code> discovery file, an AI plugin manifest, answer-first content, and explicit
          crawl permissions for AI bots.
        </p>
      </Section>

      <Section icon={Layers} title="How CitableHub works">
        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold font-mono flex items-center justify-center text-sm">{i + 1}</div>
              <div>
                <h3 className="font-bold text-sm font-display">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section icon={ShieldCheck} title="The Citability Score — five dimensions">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Every profile is measured on five dimensions, each scored 0-100. The score reflects only what is actually filled in — there
          are no fabricated metrics, reviews, or ratings.
        </p>
        <dl className="space-y-3">
          {CITABILITY_DIMENSIONS.map((d) => (
            <div key={d.name} className="bg-card border border-border rounded-xl p-4">
              <dt className="font-bold text-sm font-display text-primary">{d.name}</dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">{d.desc}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section icon={Zap} title="What is GQI, and how is CitableHub free?">
        <p className="text-sm text-muted-foreground leading-relaxed">
          GQI stands for <strong className="text-foreground">Generative Query Index</strong> — a measure of how likely your project is to
          be cited by AI systems when users ask relevant questions. Listing is 100% free, with no subscription and no credit card. The
          only paid product is a one-time <Link href="/boost" className="text-primary hover:underline">GQI Boost</Link>: a temporary
          visibility campaign that lifts your project's placement for a fixed duration. Boosts never alter the underlying facts of a
          profile — they only amplify reach.
        </p>
      </Section>

      <Section icon={Building2} title="Who builds CitableHub">
        <p className="text-sm text-muted-foreground leading-relaxed">
          CitableHub is built by <a href="https://wildverse.io" rel="noopener" className="text-primary hover:underline">Wildverse LLC</a>,
          a company focused on AI-native discovery infrastructure. Explore the live <Link href="/projects" className="text-primary hover:underline">projects directory</Link>,
          ask <Link href="/chat" className="text-primary hover:underline">Discovery AI</Link> a question, or
          <Link href="/submit" className="text-primary hover:underline"> list your project free</Link>.
        </p>
      </Section>

      {/* Crawlable FAQ (text content; FAQPage schema lives on the homepage) */}
      <Section icon={Search} title="Frequently asked questions">
        <div className="space-y-5">
          {FAQ_ITEMS.map((f) => (
            <div key={f.question} className="space-y-1">
              <h3 className="font-bold text-sm font-display">{f.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
            </div>
          ))}
        </div>
      </Section>
    </article>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
