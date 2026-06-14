/**
 * Helpers for SSR programmatic + content pages (about, compare, best, badge).
 * Pure functions only — safe to import from server components and route handlers.
 * No DB access here; pages/handlers fetch with Prisma and pass plain data in.
 */

export interface MinimalHeaders {
  get(key: string): string | null;
}

/** Resolve the public site URL from request headers, matching the rest of the app. */
export function resolveSiteUrl(headersList: MinimalHeaders): string {
  const host =
    headersList.get('x-forwarded-host') ||
    process.env.NEXTAUTH_URL ||
    'https://citablehub.com';
  return host.startsWith('http') ? host : `https://${host}`;
}

/**
 * Parse a comparison slug of the form `tool-a-vs-tool-b`.
 * Splits on the first `-vs-` delimiter so individual slugs may still contain dashes.
 */
export function parseComparison(param: string): { slugA: string; slugB: string } | null {
  if (!param) return null;
  const decoded = decodeURIComponent(param).toLowerCase();
  const idx = decoded.indexOf('-vs-');
  if (idx <= 0) return null;
  const slugA = decoded.slice(0, idx).trim();
  const slugB = decoded.slice(idx + 4).trim();
  if (!slugA || !slugB || slugA === slugB) return null;
  return { slugA, slugB };
}

/** Build the canonical comparison slug for two project slugs (stable alphabetical order). */
export function comparisonSlug(slugA: string, slugB: string): string {
  return [slugA, slugB].sort().join('-vs-');
}

/** Color band for a 0-100 citability score — shared by the badge and compare table. */
export function scoreColor(score: number): string {
  if (score >= 80) return '#059669'; // emerald — excellent
  if (score >= 60) return '#2563EB'; // blue — strong
  if (score >= 40) return '#D97706'; // amber — fair
  return '#6B7280'; // gray — emerging
}

/** Human-readable band label for a 0-100 citability score. */
export function scoreBand(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Strong';
  if (score >= 40) return 'Fair';
  return 'Emerging';
}

/** Statuses that should never appear on public SSR surfaces. */
export const PUBLIC_STATUS_FILTER = { notIn: ['rejected', 'flagged', 'draft'] };
