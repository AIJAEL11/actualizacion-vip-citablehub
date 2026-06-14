/**
 * GQI (Generative Query Index) — the unit a builder buys with a Boost and sees
 * delivered. A weighted sum of real engagement signals from AnalyticsEvent.
 *
 * Human signals count fully. AI-bot impressions count too (an AI crawler seeing
 * the listing is the product), but at a fixed weight. Other bot noise is ignored
 * so paid delivery can't be gamed by bots.
 */

export const GQI_WEIGHTS: Record<string, number> = {
  project_impression: 1,
  search_impression: 1,
  project_view: 4,
  project_click: 4,
  project_click_website: 6,
  project_save: 8,
};

export const AI_BOT_IMPRESSION_GQI = 3;

const IMPRESSION_TYPES = new Set(['project_impression', 'search_impression', 'project_view']);

export interface GqiBreakdown {
  gqi: number;
  impressions: number;
  clicks: number;
  websiteClicks: number;
  saves: number;
  aiBotImpressions: number;
}

function isBot(ev: any): boolean {
  return ev?.metadata?.agentClass === 'bot';
}

/** Aggregate a list of AnalyticsEvents into a GQI breakdown. */
export function gqiFromEvents(events: { type: string; metadata?: any }[]): GqiBreakdown {
  let gqi = 0;
  let impressions = 0;
  let clicks = 0;
  let websiteClicks = 0;
  let saves = 0;
  let aiBotImpressions = 0;

  for (const ev of events) {
    const t = ev?.type;
    if (isBot(ev)) {
      // Only AI-bot impressions are valuable for GQI; other bot noise is dropped.
      if (IMPRESSION_TYPES.has(t)) {
        aiBotImpressions += 1;
        gqi += AI_BOT_IMPRESSION_GQI;
      }
      continue;
    }
    const w = GQI_WEIGHTS[t];
    if (w === undefined) continue;
    gqi += w;
    if (IMPRESSION_TYPES.has(t)) impressions += 1;
    if (t === 'project_click') clicks += 1;
    if (t === 'project_click_website') websiteClicks += 1;
    if (t === 'project_save') saves += 1;
  }

  return {
    gqi: Math.round(gqi),
    impressions,
    clicks,
    websiteClicks,
    saves,
    aiBotImpressions,
  };
}

/** Percent lift of `current` vs `baseline`. Returns null if no baseline to compare. */
export function liftPct(current: number, baseline: number): number | null {
  if (baseline <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - baseline) / baseline) * 100);
}

/** Build a shareable one-line summary of a delivered boost. */
export function boostSummary(opts: {
  packType?: string | null;
  delivered: GqiBreakdown;
  impressionsLift: number | null;
  rankPosition?: number | null;
}): string {
  const tier = (opts.packType || 'Boost').replace(/^\w/, (c) => c.toUpperCase());
  const parts = [`Your ${tier} delivered ${opts.delivered.gqi.toLocaleString()} GQI`];
  if (opts.impressionsLift !== null) parts.push(`+${opts.impressionsLift}% impressions`);
  if (opts.delivered.websiteClicks > 0) parts.push(`${opts.delivered.websiteClicks} website visits`);
  if (opts.rankPosition && opts.rankPosition > 0) parts.push(`directory rank #${opts.rankPosition}`);
  return parts.join(' · ') + '.';
}
