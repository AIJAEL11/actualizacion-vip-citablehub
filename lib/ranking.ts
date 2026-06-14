/**
 * CitableHub Ranking System
 *
 * Priority order (tiers) — used ONLY for visibility ORDER, not for the score:
 * 1. PLATFORM_PARTNER → always top (pinned)
 * 2. Active Boost → boost_score > 0   (paid promotion = position only)
 * 3. Real projects (isSeeded=false) → by dynamicScore then legacy score
 * 4. Seeded projects (isSeeded=true) → by dynamicScore then legacy score
 *
 * Boost affects the tier above, NOT getRankScore — paying never adds points.
 */
import { normalizeTrust } from './geo-score';

export function getRankScore(p: any): number {
  // If dynamicScore has been calculated, use it (already 0-100+, capped here).
  if ((p?.dynamicScore ?? 0) > 0) {
    return Math.min(p.dynamicScore, 100);
  }
  // Legacy formula for projects without activity data — engagement + trust only,
  // trust normalized to 0-1, boost removed, hard-capped 0-100.
  const relevance = Math.min(
    ((p?.impressions ?? 0) + (p?.clicks ?? 0) * 2 + (p?.savesCount ?? 0) * 3) / 100,
    1
  );
  const trust = normalizeTrust(p?.trustScore);
  return Math.round(Math.min((relevance * 0.6 + trust * 0.4) * 100, 100));
}

/**
 * Sort projects with the tier priority system.
 * Returns a new sorted array.
 */
export function sortByPriority(projects: any[]): any[] {
  return [...projects].sort((a, b) => {
    // 1. Platform partners always first (oldest partner first for stable ordering)
    const aPartner = a?.platformPartner ? 1 : 0;
    const bPartner = b?.platformPartner ? 1 : 0;
    if (bPartner !== aPartner) return bPartner - aPartner;
    if (aPartner && bPartner) {
      // Sort partners by dynamicScore descending (highest score first)
      return (b?.dynamicScore ?? 0) - (a?.dynamicScore ?? 0);
    }

    // 2. Active boost
    const aBoost = (a?.boostScore ?? 0) > 0 ? 1 : 0;
    const bBoost = (b?.boostScore ?? 0) > 0 ? 1 : 0;
    if (bBoost !== aBoost) return bBoost - aBoost;

    // 3. Real projects over seeded
    const aReal = a?.isSeeded === false ? 1 : 0;
    const bReal = b?.isSeeded === false ? 1 : 0;
    if (bReal !== aReal) return bReal - aReal;

    // 4. Within same tier: dynamicScore (desc), then legacy score
    const aDyn = a?.dynamicScore ?? 0;
    const bDyn = b?.dynamicScore ?? 0;
    if (aDyn !== bDyn) return bDyn - aDyn;

    // 5. Legacy score fallback
    const sa = getRankScore(a);
    const sb = getRankScore(b);
    if (sb !== sa) return sb - sa;

    // 6. Tiebreaker: newest first
    return new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime();
  });
}
