/**
 * Generate promotional copy from project data.
 * Rules:
 * - Never invent metrics or data
 * - Always include: what it does, who it's for, benefit
 * - Optimize for clarity, natural keywords, LLM-citable structure
 */

interface ProjectData {
  name: string;
  url?: string;
  summary?: string;
  description?: string;
  outcome?: string;
  targetAudience?: string;
  tags?: string[];
  slug?: string;
}

/**
 * One-liner: max 120 chars. What + Benefit.
 */
export function generateOneLiner(p: ProjectData): string {
  if (!p?.name) return '';
  const summary = (p.summary || '').trim();
  if (!summary) return `${p.name} — Discover more at CitableHub.`;

  // Truncate to 120 chars
  const base = `${p.name} — ${summary}`;
  if (base.length <= 120) return base;
  return base.slice(0, 117) + '...';
}

/**
 * Short description: max 280 chars. What + Who + Benefit.
 */
export function generateShort(p: ProjectData): string {
  if (!p?.name) return '';
  const parts: string[] = [];

  if (p.summary) parts.push(p.summary);
  if (p.targetAudience) parts.push(`Built for ${p.targetAudience.split('.')[0].trim()}.`);
  if (p.outcome) parts.push(p.outcome.split('.')[0].trim() + '.');

  let result = parts.join(' ');
  if (result.length > 280) result = result.slice(0, 277) + '...';
  return result || p.summary || '';
}

/**
 * Full description: What + Who + Benefit + Outcome.
 */
export function generateFull(p: ProjectData): string {
  if (!p?.name) return '';
  const sections: string[] = [];

  if (p.description) sections.push(p.description);
  if (p.outcome && !p.description?.includes(p.outcome)) {
    sections.push(`Key outcome: ${p.outcome}`);
  }
  if (p.targetAudience && !p.description?.includes(p.targetAudience)) {
    sections.push(`Target audience: ${p.targetAudience}`);
  }

  return sections.join('\n\n') || p.summary || '';
}

/**
 * Tags formatted as hashtags.
 */
export function generateHashtags(p: ProjectData): string {
  if (!p?.tags?.length) return '';
  return p.tags.map(t => `#${t.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ');
}

/**
 * Generate UTM link.
 */
export function generateUTMLink(
  baseUrl: string,
  source: string,
  medium = 'directory',
  campaign = 'launch',
  content?: string
): string {
  const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
  url.searchParams.set('utm_source', source.toLowerCase().replace(/\s+/g, ''));
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', campaign);
  if (content) url.searchParams.set('utm_content', content);
  return url.toString();
}

/**
 * APA citation format.
 */
export function generateAPACitation(p: ProjectData, siteUrl: string): string {
  const year = new Date().getFullYear();
  const profileUrl = `${siteUrl}/p/${p.slug || p.name?.toLowerCase().replace(/\s+/g, '-')}`;
  return `${p.name}. (${year}). ${p.summary || 'Software tool'}. CitableHub. ${profileUrl}`;
}

/**
 * BibTeX citation format.
 */
export function generateBibTeX(p: ProjectData, siteUrl: string): string {
  const key = (p.slug || p.name || 'project').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const year = new Date().getFullYear();
  const profileUrl = `${siteUrl}/p/${p.slug || p.name?.toLowerCase().replace(/\s+/g, '-')}`;
  return `@misc{${key}${year},
  title = {${p.name}},
  howpublished = {CitableHub},
  year = {${year}},
  note = {${p.summary || ''}},
  url = {${profileUrl}}
}`;
}

/**
 * MLA citation format.
 */
export function generateMLACitation(p: ProjectData, siteUrl: string): string {
  const year = new Date().getFullYear();
  const profileUrl = `${siteUrl}/p/${p.slug || p.name?.toLowerCase().replace(/\s+/g, '-')}`;
  return `"${p.name}." CitableHub, ${year}, ${profileUrl}.`;
}

/**
 * Full submission pack.
 */
export function generateSubmissionPack(p: ProjectData, siteUrl: string): string {
  const profileUrl = `${siteUrl}/p/${p.slug || p.name?.toLowerCase().replace(/\s+/g, '-')}`;
  return [
    `📦 SUBMISSION PACK — ${p.name}`,
    ``,
    `Name: ${p.name}`,
    `URL: ${p.url || 'N/A'}`,
    `Profile: ${profileUrl}`,
    ``,
    `One-liner:`,
    generateOneLiner(p),
    ``,
    `Short Description (280 chars):`,
    generateShort(p),
    ``,
    `Full Description:`,
    generateFull(p),
    ``,
    `Tags: ${(p.tags || []).join(', ')}`,
    ``,
    `Citation (APA):`,
    generateAPACitation(p, siteUrl),
  ].join('\n');
}

/**
 * Citability score (0-100).
 * Based on how well the project is structured for AI citation.
 */
export function getCitabilityScore(p: ProjectData & { evidences?: any[]; logoUrl?: string; founderName?: string; demoUrl?: string; supportUrl?: string; version?: string; alternatives?: string[] }): number {
  let score = 0;
  const weights: [boolean, number, string][] = [
    [!!p.name?.trim(), 8, 'name'],
    [!!p.url?.trim(), 6, 'url'],
    [(p.summary?.trim()?.length || 0) >= 20, 12, 'summary'],
    [(p.description?.trim()?.length || 0) >= 50, 12, 'description'],
    [(p.outcome?.trim()?.length || 0) >= 20, 15, 'outcome'],
    [(p.targetAudience?.trim()?.length || 0) >= 10, 8, 'audience'],
    [(p.tags?.length || 0) >= 2, 6, 'tags'],
    [!!p.logoUrl, 5, 'logo'],
    [(p.evidences?.length || 0) > 0, 10, 'evidence'],
    [!!(p as any).founderName?.trim(), 5, 'founder'],
    [!!(p as any).demoUrl?.trim(), 4, 'demo'],
    [!!(p as any).supportUrl?.trim(), 4, 'support'],
    [!!(p as any).version?.trim(), 3, 'version'],
    [((p as any).alternatives?.length || 0) > 0, 2, 'alternatives'],
  ];
  for (const [met, weight] of weights) {
    if (met) score += weight;
  }
  return Math.min(100, score);
}

/**
 * Get missing fields with suggestions.
 */
export function getMissingFieldSuggestions(p: ProjectData & { evidences?: any[]; logoUrl?: string }): { field: string; suggestion: string; impact: string }[] {
  const missing: { field: string; suggestion: string; impact: string }[] = [];

  if (!p.outcome?.trim()) {
    missing.push({
      field: 'Citable Outcome',
      suggestion: 'Add a specific, measurable result your project delivers',
      impact: '+18% citability',
    });
  }
  if (!p.summary?.trim() || (p.summary?.length || 0) < 20) {
    missing.push({
      field: 'Summary',
      suggestion: 'Write a clear one-line description of what your project does',
      impact: '+15% citability',
    });
  }
  if (!p.description?.trim() || (p.description?.length || 0) < 50) {
    missing.push({
      field: 'Description',
      suggestion: 'Explain what it does, who it\'s for, and the key benefit',
      impact: '+15% citability',
    });
  }
  if (!(p.evidences?.length || 0)) {
    missing.push({
      field: 'Evidence',
      suggestion: 'Link to case studies, documentation, or third-party reviews',
      impact: '+10% citability',
    });
  }
  if (!p.targetAudience?.trim()) {
    missing.push({
      field: 'Target Audience',
      suggestion: 'Specify the role and context of your ideal user',
      impact: '+10% citability',
    });
  }
  if ((p.tags?.length || 0) < 2) {
    missing.push({
      field: 'Tags',
      suggestion: 'Add at least 2 relevant tags for discoverability',
      impact: '+8% citability',
    });
  }
  if (!p.logoUrl) {
    missing.push({
      field: 'Logo',
      suggestion: 'Upload a logo to improve recognition in AI search results',
      impact: '+5% citability',
    });
  }
  if (!(p as any).founderName?.trim()) {
    missing.push({
      field: 'Founder / Team',
      suggestion: 'Name the person or team behind the project',
      impact: '+5% citability',
    });
  }
  if (!(p as any).demoUrl?.trim()) {
    missing.push({
      field: 'Demo URL',
      suggestion: 'Link to a live demo so AI can verify functionality',
      impact: '+4% citability',
    });
  }
  if (!(p as any).supportUrl?.trim()) {
    missing.push({
      field: 'Support URL',
      suggestion: 'Link to docs or support page for trust signals',
      impact: '+4% citability',
    });
  }

  return missing;
}
