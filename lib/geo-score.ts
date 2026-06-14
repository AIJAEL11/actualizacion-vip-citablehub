/**
 * CitableHub organic GEO score — the defensible 0-100 number LLMs and owners see.
 *
 * Four factors, 25 points each, every point traceable to verifiable data:
 *   1. Completeness     — profile fields filled (reuses getCompleteness)
 *   2. Citable structure— inputs that produce JSON-LD, answer-first, FAQ
 *   3. Freshness        — decays with time since last verification/update
 *   4. Verified claim   — claimed by its owner = full trust
 *
 * Reproducible: same data → same score, no randomness. Hard-capped 0-100.
 * Boost has NO effect here — it only changes ordering (see lib/ranking.ts).
 */
import { getCompleteness } from './completeness';

export interface GeoFactor {
  key: string;
  label: string;
  score: number; // 0..max
  max: number;
  hint: string;
}

export interface GeoScore {
  total: number; // 0-100
  factors: GeoFactor[];
}

const MAX = 25;

function daysSince(d: any): number {
  if (!d) return Infinity;
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / 86_400_000;
}

export function getGeoScore(p: any): GeoScore {
  // 1) Completeness (0-1 → 0-25)
  const completeness = Math.round(getCompleteness(p) * MAX);

  // 2) Citable structure — does it carry the inputs our pages turn into
  //    JSON-LD (SoftwareApplication), an answer-first summary, and a FAQ?
  const structureChecks = [
    !!(p?.summary && p.summary.trim().length >= 40), // answer-first line
    !!(p?.description && p.description.trim().length >= 80), // FAQ depth
    !!(p?.category && p.category.toString().trim()), // applicationCategory
    !!(p?.url && /^https?:\/\//i.test(p.url)), // valid URL for schema
    !!(p?.outcome && p.outcome.trim().length >= 15), // citable fact
  ];
  const structure = Math.round((structureChecks.filter(Boolean).length / structureChecks.length) * MAX);

  // 3) Freshness — decays with time since last verification/update
  const d = daysSince(p?.lastReviewed || p?.updatedAt);
  let freshness: number;
  if (d <= 30) freshness = 25;
  else if (d <= 90) freshness = 18;
  else if (d <= 180) freshness = 11;
  else if (d <= 365) freshness = 5;
  else freshness = 0;

  // 4) Verified claim — claimed by owner = full trust
  const verified = p?.verificationStatus === 'verified' || p?.status === 'verified';
  const claimed = !!p?.ownerId;
  const claim = verified ? 25 : claimed ? 20 : 0;

  const factors: GeoFactor[] = [
    { key: 'completeness', label: 'Completeness', score: completeness, max: MAX, hint: 'Fill in description, category, URL, logo, tags, and audience.' },
    { key: 'structure', label: 'Citable structure', score: structure, max: MAX, hint: 'Add an answer-first summary, a deeper description, a citable outcome, and a valid URL.' },
    { key: 'freshness', label: 'Freshness', score: freshness, max: MAX, hint: 'Update or re-verify your listing to keep it fresh.' },
    { key: 'claim', label: 'Verified claim', score: claim, max: MAX, hint: 'Claim this project as its owner (and get verified) to earn full trust.' },
  ];

  const total = Math.min(100, Math.max(0, factors.reduce((s, f) => s + f.score, 0)));
  return { total, factors };
}

/**
 * Normalize a possibly mis-scaled legacy trustScore to 0-1.
 * Seeded data stored trustScore on a 0-100 scale (e.g. 45); real records use
 * 0-1 (e.g. 0.70). This keeps both consistent without touching the DB.
 */
export function normalizeTrust(t: any): number {
  const n = typeof t === 'number' ? t : 0;
  if (n > 1) return Math.min(n / 100, 1);
  return Math.max(0, n);
}
