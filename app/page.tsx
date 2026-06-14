export const dynamic = "force-dynamic";

import { prisma } from '@/lib/db';
import { CitableHubApp } from '@/components/citablehub-app';
import { sortByPriority } from '@/lib/ranking';
import { FAQ_ITEMS } from '@/lib/faq-data';

export default async function Home() {
  let projects: any[] = [];
  let categories: any[] = [];
  let intents: any[] = [];

  try {
    const rawProjects = await prisma.project.findMany({
      where: { status: { notIn: ['rejected', 'flagged'] } },
      include: { evidences: true },
    });
    projects = sortByPriority(rawProjects);
  } catch (e) { console.warn('Failed to load projects:', e); }

  try {
    categories = await prisma.category.findMany();
  } catch (e) { console.warn('Failed to load categories:', e); }

  try {
    intents = await prisma.intentTag.findMany();
  } catch (e) { console.warn('Failed to load intents:', e); }

  // Serialize dates for client
  const serializedProjects = (projects ?? []).map((p: any) => ({
    ...(p ?? {}),
    createdAt: p?.createdAt?.toISOString?.() ?? '',
    updatedAt: p?.updatedAt?.toISOString?.() ?? '',
    evidences: (p?.evidences ?? []).map((e: any) => ({
      ...(e ?? {}),
      createdAt: e?.createdAt?.toISOString?.() ?? '',
    })),
  }));

  // JSON-LD structured data for GEO/AEO optimization
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'CitableHub',
        url: 'https://citablehub.com',
        logo: 'https://citablehub.com/logo.png',
        description: 'The AI-readable project directory. CitableHub structures your project so AI systems recommend it, directories list it, and real users find it.',
        sameAs: [],
        foundingDate: '2026',
      },
      {
        '@type': 'WebApplication',
        name: 'CitableHub',
        url: 'https://citablehub.com',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'AI-citable project directory with structured profiles, promotion kits, and GQI Boost campaigns for software, apps, and digital projects.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free to list. No credit card required.',
        },
      },
      {
        '@type': 'WebSite',
        name: 'CitableHub',
        url: 'https://citablehub.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://citablehub.com/projects?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  // FAQPage JSON-LD for AI citation and rich snippets
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <CitableHubApp
        initialProjects={serializedProjects}
        initialCategories={categories}
        initialIntents={intents}
      />
    </>
  );
}
