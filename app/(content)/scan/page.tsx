export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Radar } from 'lucide-react';
import ScanTool from '@/components/scan-tool';
import { resolveSiteUrl } from '@/lib/programmatic-pages';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = resolveSiteUrl(headers());
  const title = 'Free GEO Scan — is your SaaS citable by AI?';
  const description =
    'Scan any website for free and get a 0-100 GEO score: can ChatGPT, Perplexity, and Claude find, verify, and cite it? Checks robots.txt, llms.txt, ai-plugin.json and more — no login required.';
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/scan` },
    openGraph: { title, description, url: `${siteUrl}/scan`, siteName: 'CitableHub', type: 'website' },
    robots: { index: true, follow: true },
  };
}

export default function ScanPage() {
  const siteUrl = resolveSiteUrl(headers());

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CitableHub GEO Scan',
    url: `${siteUrl}/scan`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: 'A free tool that scores how citable any website is by AI search engines.',
    isPartOf: { '@type': 'WebSite', name: 'CitableHub', url: siteUrl },
  };

  return (
    <div className="py-8 max-w-2xl mx-auto space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Radar className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">Free GEO Scan</h1>
        </div>
        <p className="text-base text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Can AI search engines find and cite your SaaS?</strong> Paste your URL and get a 0-100
          GEO score in seconds — we check whether your site is reachable, whether <code className="text-primary">robots.txt</code> allows
          AI crawlers, and whether you expose <code className="text-primary">llms.txt</code> and an AI plugin manifest. No login, no
          signup.
        </p>
      </header>

      <ScanTool />

      <p className="text-xs text-muted-foreground text-center">
        Scanning fetches only public files on the domain you enter. CitableHub does not store your site’s content.
      </p>
    </div>
  );
}
