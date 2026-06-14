export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Mail } from 'lucide-react';
import ContactForm from '@/components/contact-form';
import { resolveSiteUrl } from '@/lib/programmatic-pages';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = resolveSiteUrl(headers());
  const title = 'Contact CitableHub — Support, Partnerships & Privacy';
  const description =
    'Get in touch with the CitableHub team for questions, technical support, partnership opportunities, or privacy and data requests. We respond within 24-48 hours.';
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/contact` },
    openGraph: { title, description, url: `${siteUrl}/contact`, siteName: 'CitableHub', type: 'website' },
    robots: { index: true, follow: true },
  };
}

export default function ContactPage() {
  const siteUrl = resolveSiteUrl(headers());

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact — CitableHub',
    description: 'Contact the CitableHub team for questions, support, partnerships, or privacy requests.',
    url: `${siteUrl}/contact`,
    isPartOf: { '@type': 'WebSite', name: 'CitableHub', url: siteUrl },
    mainEntity: {
      '@type': 'Organization',
      name: 'CitableHub',
      email: 'hello@citablehub.com',
      url: siteUrl,
      contactPoint: [
        { '@type': 'ContactPoint', contactType: 'customer support', email: 'hello@citablehub.com', availableLanguage: 'English' },
        { '@type': 'ContactPoint', contactType: 'privacy', email: 'privacy@citablehub.com', availableLanguage: 'English' },
      ],
    },
  };

  return (
    <div className="py-8 max-w-2xl mx-auto space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-display">Contact Us</h1>
            <p className="text-sm text-muted-foreground">We'd love to hear from you. Questions, feedback, partnership ideas — all welcome.</p>
          </div>
        </div>
      </div>

      <ContactForm />

      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-bold text-sm">Other ways to reach us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">General</p>
            <p>hello@citablehub.com</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Privacy &amp; Legal</p>
            <p>privacy@citablehub.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
