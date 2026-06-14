/**
 * Generators for the GEO assets CitableHub hands back to a builder:
 * llms.txt, /.well-known/ai-plugin.json, and a FAQPage JSON-LD block.
 * Template-based and deterministic so the same input yields the same output.
 */

export interface GeneratablePlatform {
  name: string;
  url: string;
  description?: string | null;
  stack?: string[] | null;
  slug?: string | null;
}

function safeOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url.replace(/\/+$/, '');
  }
}

function modelName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'platform';
}

export function generateLlmsTxt(p: GeneratablePlatform): string {
  const base = safeOrigin(p.url);
  const desc = (p.description || `${p.name} is a software platform.`).trim();
  const stackLine = p.stack && p.stack.length ? `\n## Stack\n${p.stack.join(', ')}` : '';
  return `# ${p.name}
> ${desc}

## What this is
${p.name} is listed and verified on CitableHub, the AI-visibility platform. This file helps AI search engines (ChatGPT, Perplexity, Claude, Gemini) discover and cite ${p.name} accurately.
${stackLine}

## Key pages
- ${base} — Homepage
- ${base}/.well-known/ai-plugin.json — AI plugin manifest

## Citable profile
- https://citablehub.com/p/${p.slug || modelName(p.name)} — Verified CitableHub profile

## Contact
See ${base}
`;
}

export function generateAiPluginJson(p: GeneratablePlatform): string {
  const base = safeOrigin(p.url);
  const desc = (p.description || `${p.name} is a software platform.`).trim();
  const manifest = {
    schema_version: 'v1',
    name_for_human: p.name,
    name_for_model: modelName(p.name),
    description_for_human: desc.slice(0, 120),
    description_for_model: desc,
    auth: { type: 'none' },
    api: { type: 'openapi', url: `${base}/openapi.json`, is_user_authenticated: false },
    logo_url: `${base}/logo.png`,
    contact_email: `hello@${(() => { try { return new URL(base).hostname.replace(/^www\./, ''); } catch { return 'example.com'; } })()}`,
    legal_info_url: `${base}/terms`,
    llms_txt_url: `${base}/llms.txt`,
    verified_by: 'https://citablehub.com',
  };
  return JSON.stringify(manifest, null, 2);
}

export function generateFaqSchema(p: GeneratablePlatform): string {
  const desc = (p.description || `${p.name} is a software platform.`).trim();
  const stack = p.stack && p.stack.length ? p.stack.join(', ') : 'modern web technologies';
  const faqs = [
    { q: `What is ${p.name}?`, a: desc },
    { q: `What can ${p.name} do?`, a: `${p.name} ${desc.replace(new RegExp(`^${p.name}\\s+(is|are)\\s+`, 'i'), 'helps you ')}`.slice(0, 280) },
    { q: `What is ${p.name} built with?`, a: `${p.name} is built with ${stack}.` },
    { q: `Where can I learn more about ${p.name}?`, a: `Visit ${safeOrigin(p.url)} or its verified profile on CitableHub.` },
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return JSON.stringify(jsonLd, null, 2);
}

export function generateAllAssets(p: GeneratablePlatform) {
  return {
    llmsTxt: generateLlmsTxt(p),
    aiPluginJson: generateAiPluginJson(p),
    faqSchema: generateFaqSchema(p),
  };
}
