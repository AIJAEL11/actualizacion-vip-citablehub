export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Plug, Terminal, ScanSearch, FileCode2, BadgeCheck, ListChecks } from 'lucide-react';
import McpTokenManager from '@/components/mcp-token-manager';
import { resolveSiteUrl } from '@/lib/programmatic-pages';

const TOOLS = [
  { icon: Plug, name: 'citablehub_register', desc: 'Register your platform (name, URL, description, stack).' },
  { icon: ScanSearch, name: 'citablehub_analyze', desc: 'Audit your GEO score 0-100 with live robots.txt / llms.txt / ai-plugin.json checks.' },
  { icon: FileCode2, name: 'citablehub_generate', desc: 'Get ready-to-paste llms.txt, ai-plugin.json, and FAQ schema.' },
  { icon: ListChecks, name: 'citablehub_listing', desc: 'Publish your platform to the public CitableHub directory.' },
  { icon: BadgeCheck, name: 'citablehub_badge', desc: 'Get an embeddable "Citable Verified" badge that backlinks to your profile.' },
];

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = resolveSiteUrl(headers());
  const title = 'CitableHub MCP Gateway — make your SaaS citable by AI';
  const description =
    'Connect your SaaS to CitableHub via MCP from Claude Code, OCTOPUS, or any MCP client. Register, audit your GEO score, generate llms.txt + ai-plugin.json, list publicly, and get a Citable Verified badge — all from your dev environment.';
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/mcp` },
    openGraph: { title, description, url: `${siteUrl}/mcp`, siteName: 'CitableHub', type: 'website' },
    robots: { index: true, follow: true },
  };
}

export default function McpPage() {
  const siteUrl = resolveSiteUrl(headers());
  const connectCmd = `claude mcp add --transport http citablehub ${siteUrl}/api/mcp \\\n  --header "Authorization: Bearer chmcp_YOUR_TOKEN"`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'CitableHub MCP Gateway',
    url: `${siteUrl}/mcp`,
    description:
      'An MCP server that lets builders register, audit, and publish their SaaS to CitableHub so AI search engines can discover and cite it.',
    isPartOf: { '@type': 'WebSite', name: 'CitableHub', url: siteUrl },
  };

  return (
    <div className="py-8 max-w-3xl mx-auto space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Plug className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">MCP Gateway</h1>
        </div>
        <p className="text-base text-muted-foreground leading-relaxed">
          <strong className="text-foreground">The CitableHub MCP Gateway lets you make your SaaS citable by AI from inside your dev environment.</strong> Connect
          once via the Model Context Protocol (MCP) from Claude Code, OCTOPUS, Antigravity, or any MCP client. Then register your
          platform, audit its GEO score, generate the discovery files, publish to the public directory, and grab a verified badge —
          without leaving your terminal.
        </p>
      </header>

      {/* Connect in 3 steps */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2"><Terminal className="h-5 w-5 text-primary" /> Connect in 3 steps</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3"><Step n={1} /> <span><strong>Generate a token</strong> below (you must be signed in).</span></li>
          <li className="flex gap-3"><Step n={2} /> <span><strong>Add the server</strong> to your MCP client with that token:</span></li>
        </ol>
        <pre className="bg-card border border-border rounded-xl p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap break-all">{connectCmd}</pre>
        <ol className="space-y-3 text-sm" start={3}>
          <li className="flex gap-3"><Step n={3} /> <span>Ask your AI to <em>"register my platform on CitableHub and audit its GEO score."</em></span></li>
        </ol>
      </section>

      {/* Tools */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display tracking-tight">The 5 tools</h2>
        <div className="grid gap-3">
          {TOOLS.map((t) => (
            <div key={t.name} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
              <t.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <code className="text-sm font-bold font-mono text-primary">{t.name}</code>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Token manager */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2"><KeyIcon /> Your MCP tokens</h2>
        <p className="text-sm text-muted-foreground">
          Tokens authenticate your MCP client and scope every call to your own platforms. We store only a hash — copy a token when you
          create it, because it’s shown only once.
        </p>
        <McpTokenManager />
      </section>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-bold font-mono flex items-center justify-center text-xs">{n}</span>;
}

function KeyIcon() {
  return <BadgeCheck className="h-5 w-5 text-primary" />;
}
