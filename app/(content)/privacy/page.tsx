export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Shield, Lock, Eye, Database, Globe, Mail, Calendar } from 'lucide-react';
import { resolveSiteUrl } from '@/lib/programmatic-pages';

const LAST_UPDATED = 'June 2, 2026';
const LAST_UPDATED_ISO = '2026-06-02';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = resolveSiteUrl(headers());
  const title = 'Privacy Policy — CitableHub';
  const description =
    'How CitableHub collects, uses, and protects your data. We never sell personal information and we actively enable AI crawlers to index public project profiles.';
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/privacy` },
    openGraph: { title, description, url: `${siteUrl}/privacy`, siteName: 'CitableHub', type: 'website' },
    robots: { index: true, follow: true },
  };
}

export default function PrivacyPage() {
  const siteUrl = resolveSiteUrl(headers());

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy — CitableHub',
    description: 'Privacy Policy for CitableHub, the AI-optimized project registry.',
    url: `${siteUrl}/privacy`,
    isPartOf: { '@type': 'WebSite', name: 'CitableHub', url: siteUrl },
    dateModified: LAST_UPDATED_ISO,
    inLanguage: 'en',
  };

  return (
    <article className="py-8 max-w-3xl mx-auto space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-display">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Last updated: {LAST_UPDATED}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          CitableHub ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at citablehub.com.
        </p>
      </div>

      <Section icon={Database} title="1. Information We Collect">
        <h4 className="font-bold text-sm mt-3">1.1 Information You Provide</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          <li><strong>Account Data:</strong> Email address, display name, and password (hashed) when you create an account.</li>
          <li><strong>Google OAuth Data:</strong> If you sign in with Google, we receive your email, name, and profile picture from Google. We do not access your Google contacts, files, or other account data.</li>
          <li><strong>Project Data:</strong> All information you submit about your projects — name, URL, description, founder name, screenshots, and other profile fields.</li>
          <li><strong>Contact Information:</strong> Any messages or inquiries submitted through our contact form.</li>
          <li><strong>Payment Data:</strong> When purchasing GQI Boost, payment is processed by Stripe. We store your Stripe customer ID and subscription status but never your credit card number or full payment details.</li>
        </ul>
        <h4 className="font-bold text-sm mt-4">1.2 Information Collected Automatically</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          <li><strong>Analytics Events:</strong> Page views, clicks, searches, and interactions with the platform to improve ranking and discovery features.</li>
          <li><strong>Device &amp; Browser Info:</strong> User-agent string, browser type, and device information for bot detection and platform optimization.</li>
          <li><strong>AI Interaction Data:</strong> Queries made through Discovery AI are logged to improve search quality. These are anonymized and not linked to individual users unless you are signed in.</li>
        </ul>
      </Section>

      <Section icon={Eye} title="2. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><strong>Platform Operation:</strong> To create and manage your account, display your projects, and process subscriptions.</li>
          <li><strong>AI Citability:</strong> To structure your project data for optimal visibility in AI search systems (Google AI Overviews, Perplexity, ChatGPT, Gemini).</li>
          <li><strong>Ranking &amp; Discovery:</strong> To calculate dynamic rankings, citability scores, and completeness metrics that help users find the best tools.</li>
          <li><strong>Notifications:</strong> To send you relevant updates about your projects — ranking changes, completeness reminders, and platform news. You can manage notification preferences.</li>
          <li><strong>Analytics:</strong> To understand usage patterns, improve the platform, and detect automated bot traffic.</li>
          <li><strong>Communication:</strong> To respond to your inquiries and provide customer support.</li>
        </ul>
      </Section>

      <Section icon={Globe} title="3. Information Sharing & Disclosure">
        <p className="text-sm text-muted-foreground">We do <strong>not</strong> sell your personal information. We may share data in these limited circumstances:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground mt-2">
          <li><strong>Public Project Profiles:</strong> Project information you submit is publicly visible by design — this is the core purpose of CitableHub. Your project data is structured as JSON-LD to be readable by AI systems and search engines.</li>
          <li><strong>Service Providers:</strong> We use Stripe for payments, Google for authentication, and cloud infrastructure for hosting. These providers process data per their own privacy policies.</li>
          <li><strong>AI Crawlers:</strong> We actively enable AI bots (GPTBot, Google-Extended, PerplexityBot, ClaudeBot) to index public project profiles. This is a feature, not a bug — it's how your project gets cited by AI systems.</li>
          <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation.</li>
        </ul>
      </Section>

      <Section icon={Lock} title="4. Data Security">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>Passwords are hashed using bcrypt (never stored in plaintext).</li>
          <li>All connections are encrypted via HTTPS/TLS.</li>
          <li>Authentication sessions use signed JWT tokens with secure HTTP-only cookies.</li>
          <li>Payment processing is handled entirely by Stripe (PCI-DSS compliant) — we never see your full card number.</li>
          <li>Database access is restricted and monitored.</li>
        </ul>
      </Section>

      <Section icon={Database} title="5. Data Retention">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><strong>Account Data:</strong> Retained as long as your account is active. You may request deletion at any time.</li>
          <li><strong>Project Data:</strong> Public project profiles remain visible as long as the project is listed. Owners can delete or delist projects from their dashboard.</li>
          <li><strong>Analytics Data:</strong> Aggregated analytics are retained indefinitely. Individual event logs are retained for 12 months.</li>
          <li><strong>Contact Form Submissions:</strong> Retained for 24 months for support purposes.</li>
        </ul>
      </Section>

      <Section icon={Shield} title="6. Your Rights">
        <p className="text-sm text-muted-foreground">Depending on your jurisdiction, you may have the following rights:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground mt-2">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Correction:</strong> Update or correct inaccurate data via your dashboard or by contacting us.</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated personal data.</li>
          <li><strong>Portability:</strong> Request your data in a machine-readable format.</li>
          <li><strong>Opt-out:</strong> Unsubscribe from email notifications at any time.</li>
          <li><strong>AI Indexing Control:</strong> You control what project data is public. Delisted or deleted projects are removed from AI indexing.</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">To exercise these rights, visit <Link href="/contact" className="text-primary hover:underline">our contact page</Link>.</p>
      </Section>

      <Section icon={Globe} title="7. Cookies & Tracking">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><strong>Essential Cookies:</strong> Session authentication cookies (required for login functionality).</li>
          <li><strong>Analytics:</strong> We use Google Analytics to understand platform usage. You can opt out using browser extensions or settings.</li>
          <li><strong>No Third-Party Ad Tracking:</strong> We do not use advertising cookies or sell data to advertisers.</li>
        </ul>
      </Section>

      <Section icon={Eye} title="8. Children's Privacy">
        <p className="text-sm text-muted-foreground">CitableHub is not directed at children under 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.</p>
      </Section>

      <Section icon={Globe} title="9. International Data Transfers">
        <p className="text-sm text-muted-foreground">CitableHub operates globally. Your data may be processed in the United States or other countries where our infrastructure providers operate. By using CitableHub, you consent to the transfer of your data to these jurisdictions, which may have different data protection laws than your country of residence.</p>
      </Section>

      <Section icon={Calendar} title="10. Changes to This Policy">
        <p className="text-sm text-muted-foreground">We may update this Privacy Policy from time to time. When we make significant changes, we will notify registered users via email and update the "Last updated" date above. Continued use of CitableHub after changes constitutes acceptance of the revised policy.</p>
      </Section>

      <Section icon={Mail} title="11. Contact Us">
        <p className="text-sm text-muted-foreground">For privacy-related questions or to exercise your data rights:</p>
        <div className="mt-3 bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-sm"><strong>Email:</strong> privacy@citablehub.com</p>
          <p className="text-sm"><strong>Contact Page:</strong> <Link href="/contact" className="text-primary hover:underline">citablehub.com/contact</Link></p>
          <p className="text-sm"><strong>Platform:</strong> CitableHub — The Truth Engine for AI Search</p>
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
