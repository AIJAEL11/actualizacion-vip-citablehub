export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { FileText, AlertTriangle, CheckCircle, Scale, Globe, Calendar, Shield, Zap } from 'lucide-react';
import { resolveSiteUrl } from '@/lib/programmatic-pages';

const LAST_UPDATED = 'June 2, 2026';
const LAST_UPDATED_ISO = '2026-06-02';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = resolveSiteUrl(headers());
  const title = 'Terms of Service — CitableHub';
  const description =
    'The terms governing use of CitableHub, the free AI-optimized project registry: listings, AI citability, GQI Boost, and acceptable use.';
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/terms` },
    openGraph: { title, description, url: `${siteUrl}/terms`, siteName: 'CitableHub', type: 'website' },
    robots: { index: true, follow: true },
  };
}

export default function TermsPage() {
  const siteUrl = resolveSiteUrl(headers());

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service — CitableHub',
    description: 'Terms of Service for CitableHub, the AI-optimized project registry.',
    url: `${siteUrl}/terms`,
    isPartOf: { '@type': 'WebSite', name: 'CitableHub', url: siteUrl },
    dateModified: LAST_UPDATED_ISO,
    inLanguage: 'en',
  };

  return (
    <article className="py-8 max-w-3xl mx-auto space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-display">Terms of Service</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Last updated: {LAST_UPDATED}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Welcome to CitableHub. By accessing or using our platform at citablehub.com, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
        </p>
      </div>

      <Section icon={Globe} title="1. About CitableHub">
        <p className="text-sm text-muted-foreground">CitableHub is an AI-optimized project registry that helps founders, indie hackers, and SaaS builders get their tools discovered, verified, and cited by AI search systems. We provide structured profiles, citability scoring, AI discovery, promotion tools, and optional one-time visibility boosts (GQI Boost). The platform is completely free to use.</p>
      </Section>

      <Section icon={CheckCircle} title="2. Eligibility">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>You must be at least 16 years old to use CitableHub.</li>
          <li>You must provide accurate, current information when creating an account.</li>
          <li>You are responsible for maintaining the security of your account credentials.</li>
          <li>One person or entity may not maintain more than one account.</li>
        </ul>
      </Section>

      <Section icon={FileText} title="3. User-Submitted Content">
        <h4 className="font-bold text-sm mt-3">3.1 Ownership</h4>
        <p className="text-sm text-muted-foreground">You retain ownership of all content you submit to CitableHub (project descriptions, logos, screenshots, evidence links, etc.).</p>
        <h4 className="font-bold text-sm mt-3">3.2 License Grant</h4>
        <p className="text-sm text-muted-foreground">By submitting content, you grant CitableHub a worldwide, non-exclusive, royalty-free license to display, distribute, and structure your content for the purpose of:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mt-1">
          <li>Displaying your project profile on the platform</li>
          <li>Structuring data as JSON-LD for AI crawlers and search engines</li>
          <li>Including your project in Discovery AI search results</li>
          <li>Featuring your project in directory listings and recommendations</li>
        </ul>
        <h4 className="font-bold text-sm mt-3">3.3 Content Standards</h4>
        <p className="text-sm text-muted-foreground">You agree that submitted content:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mt-1">
          <li>Is accurate, truthful, and not misleading</li>
          <li>Does not infringe on any third-party intellectual property</li>
          <li>Does not contain malicious links, malware, or spam</li>
          <li>Represents a real product, tool, or service</li>
          <li>Does not impersonate another person or entity</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">We reserve the right to remove or modify content that violates these standards, without prior notice.</p>
      </Section>

      <Section icon={Scale} title="4. AI Citability & Data Structuring">
        <p className="text-sm text-muted-foreground">By listing your project on CitableHub, you understand and agree that:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground mt-2">
          <li>Your public project data will be structured as machine-readable JSON-LD schemas</li>
          <li>AI crawlers (GPTBot, Google-Extended, PerplexityBot, ClaudeBot, and others) are actively permitted to index your project profiles</li>
          <li>Your project may appear in AI-generated search results, overviews, and recommendations</li>
          <li>Citability scores, rankings, and completeness metrics are calculated algorithmically and may change</li>
          <li>We do not guarantee any specific ranking position, citability score, or AI citation outcome</li>
        </ul>
      </Section>

      <Section icon={Zap} title="5. GQI Boost & Paid Services">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>GQI Boost is a one-time paid visibility enhancement processed through Stripe.</li>
          <li>Boost provides temporary priority placement, enhanced visibility, and score bonuses for a defined duration.</li>
          <li>Refunds are handled per Stripe's policies. Contact us for specific refund inquiries.</li>
          <li>Boost does not guarantee specific traffic, conversion, or AI citation outcomes.</li>
        </ul>
      </Section>

      <Section icon={Shield} title="6. Prohibited Activities">
        <p className="text-sm text-muted-foreground">You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mt-2">
          <li>Submit false, fabricated, or misleading project information</li>
          <li>Manipulate rankings through fake engagement (bot clicks, fake saves)</li>
          <li>Scrape, crawl, or harvest data from CitableHub for commercial purposes without permission</li>
          <li>Attempt to access other users' accounts or private data</li>
          <li>Use the platform to distribute malware, phishing, or harmful content</li>
          <li>Interfere with or disrupt the platform's infrastructure</li>
          <li>Violate any applicable laws or regulations</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">Violations may result in immediate account termination without refund.</p>
      </Section>

      <Section icon={AlertTriangle} title="7. Disclaimers & Limitations">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><strong>"As Is" Basis:</strong> CitableHub is provided "as is" without warranties of any kind, express or implied.</li>
          <li><strong>No Guarantee:</strong> We do not guarantee uninterrupted service, specific ranking outcomes, or AI citation results.</li>
          <li><strong>Third-Party Services:</strong> We are not responsible for actions of third-party services (Stripe, Google, AI search providers).</li>
          <li><strong>Limitation of Liability:</strong> To the maximum extent permitted by law, CitableHub's total liability for any claim shall not exceed the amount you have paid us in the preceding 12 months.</li>
          <li><strong>AI-Generated Content:</strong> Discovery AI responses are generated by AI and may contain inaccuracies. They should not be relied upon as the sole basis for decisions.</li>
        </ul>
      </Section>

      <Section icon={FileText} title="8. Intellectual Property">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>The CitableHub name, logo, design, and proprietary algorithms (citability scoring, dynamic ranking, GQI system) are our intellectual property.</li>
          <li>You may not copy, reproduce, or create derivative works of the platform without written permission.</li>
          <li>User-submitted content remains the property of the submitter as outlined in Section 3.</li>
        </ul>
      </Section>

      <Section icon={Globe} title="9. Account Termination">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>You may delete your account at any time by contacting us.</li>
          <li>We may suspend or terminate accounts that violate these Terms.</li>
          <li>Upon termination, your public project profiles will be delisted. Your personal data will be deleted per our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</li>
          <li>Active GQI Boost campaigns will expire upon account termination.</li>
        </ul>
      </Section>

      <Section icon={Scale} title="10. Governing Law">
        <p className="text-sm text-muted-foreground">These Terms are governed by and construed in accordance with applicable laws. Any disputes arising from these Terms shall be resolved through good-faith negotiation first, and if unresolved, through binding arbitration.</p>
      </Section>

      <Section icon={Calendar} title="11. Changes to These Terms">
        <p className="text-sm text-muted-foreground">We may update these Terms from time to time. Material changes will be communicated via email to registered users at least 15 days before taking effect. Continued use after changes constitutes acceptance.</p>
      </Section>

      <Section icon={FileText} title="12. Contact">
        <p className="text-sm text-muted-foreground">Questions about these Terms? Reach us at:</p>
        <div className="mt-3 bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-sm"><strong>Email:</strong> legal@citablehub.com</p>
          <p className="text-sm"><strong>Contact Page:</strong> <Link href="/contact" className="text-primary hover:underline">citablehub.com/contact</Link></p>
        </div>
      </Section>
    </article>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold font-display flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
