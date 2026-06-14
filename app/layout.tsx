import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'
import { GoogleAnalytics } from '@/components/google-analytics'

export const dynamic = "force-dynamic";

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'CitableHub — The Truth Engine for AI Search',
  description: 'Discover verified software listings backed by citable performance evidence. Schema.org structured data for Google AI Overview, Bing Copilot, and Perplexity.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'CitableHub — The Truth Engine for AI Search',
    description: 'Verified software directory with citable evidence. Built for AI search engines.',
    url: '/',
    siteName: 'CitableHub',
    images: ['/logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CitableHub — The Truth Engine for AI Search',
    description: 'Verified software directory with citable evidence. Built for AI search engines.',
    images: ['/logo.png'],
  },
}

const SITE_URL = process.env.NEXTAUTH_URL || 'https://citablehub.com'

// Global, server-rendered entity data so every page identifies CitableHub as
// the Organization behind the directory and exposes the directory as a citable
// Dataset (with a clean machine-readable distribution at /api/llm-feed).
const globalJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'CitableHub',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description:
        'The free directory built for AI search engines to discover, verify, and cite SaaS tools — no blogs, no keywords, only structured facts.',
      parentOrganization: { '@type': 'Organization', name: 'Wildverse LLC', url: 'https://wildverse.io' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'CitableHub',
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/projects?search={query}`,
        'query-input': 'required name=query',
      },
    },
    {
      '@type': 'Dataset',
      '@id': `${SITE_URL}/#dataset`,
      name: 'CitableHub Directory',
      description:
        'A structured, continuously updated directory of AI-citable SaaS tools, each with a GEO (Generative Engine Optimization) score and verifiable facts.',
      url: `${SITE_URL}/projects`,
      creator: { '@id': `${SITE_URL}/#organization` },
      isAccessibleForFree: true,
      license: `${SITE_URL}/terms`,
      distribution: [
        { '@type': 'DataDownload', encodingFormat: 'text/markdown', contentUrl: `${SITE_URL}/api/llm-feed` },
        { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${SITE_URL}/api/projects` },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd) }} />
      </head>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster />
          <ChunkLoadErrorHandler />
          <GoogleAnalytics />
        </Providers>
      </body>
    </html>
  )
}
