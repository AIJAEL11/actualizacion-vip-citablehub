/**
 * CitableHub Dynamic Ranking Engine
 *
 * Score = humanWeightedSignals + completenessBonus
 *
 * Boost is deliberately EXCLUDED from the score — paying never inflates merit.
 * Boost only changes ordering (the boost tier in lib/ranking.ts sortByPriority).
 *
 * WEIGHTS — easy to recalibrate: just change the numbers below.
 * Bot events are counted at BOT_MULTIPLIER (0.1 = 10%) so they
 * don't inflate public ranking.
 */

import { getCompleteness } from './completeness';

// ────────────────────── CONFIGURABLE WEIGHTS ──────────────────────
export const SIGNAL_WEIGHTS = {
  project_click:         3,   // strong: user clicked to view project profile
  project_save:          5,   // very strong: user saved/bookmarked
  project_impression:    0.5, // low: project appeared in listing
  project_view:          1,   // medium: project profile page opened
  project_click_website: 4,   // strong: clicked external website link
  search_impression:     1,   // medium: appeared in search results
} as const;

export const COMPLETENESS_BONUS_MAX = 5;  // 0-5 points based on profile completeness
export const BOT_MULTIPLIER = 0.1;        // bot signals count at 10% weight
export const DECAY_DAYS = 30;             // only count events from last N days
// ─────────────────────────────────────────────────────────────────

export interface SignalSummary {
  projectId: string;
  humanSignals: Record<string, number>;
  botSignals: Record<string, number>;
  rawScore: number;
  completenessBonus: number;
  boostBonus: number;
  totalScore: number;
}

/**
 * Calculate dynamic score for a single project given its analytics events.
 * @param events — array of { type, metadata } for this project
 * @param project — project record (for completeness + boost)
 */
export function calculateProjectScore(
  events: { type: string; metadata: any }[],
  project: any
): SignalSummary {
  const humanSignals: Record<string, number> = {};
  const botSignals: Record<string, number> = {};

  for (const ev of events) {
    const t = ev.type as keyof typeof SIGNAL_WEIGHTS;
    const weight = SIGNAL_WEIGHTS[t];
    if (weight === undefined) continue;

    const isBot = ev.metadata?.agentClass === 'bot';
    if (isBot) {
      botSignals[t] = (botSignals[t] ?? 0) + 1;
    } else {
      humanSignals[t] = (humanSignals[t] ?? 0) + 1;
    }
  }

  // Weighted sum
  let rawScore = 0;
  for (const [t, count] of Object.entries(humanSignals)) {
    rawScore += count * (SIGNAL_WEIGHTS[t as keyof typeof SIGNAL_WEIGHTS] ?? 0);
  }
  for (const [t, count] of Object.entries(botSignals)) {
    rawScore += count * (SIGNAL_WEIGHTS[t as keyof typeof SIGNAL_WEIGHTS] ?? 0) * BOT_MULTIPLIER;
  }

  // Completeness bonus (0 to COMPLETENESS_BONUS_MAX)
  const comp = getCompleteness(project);
  const completenessBonus = comp * COMPLETENESS_BONUS_MAX;

  // Boost intentionally does NOT affect the organic score — it only changes
  // ordering (the boost tier in lib/ranking.ts). Kept at 0 for response shape.
  const boostBonus = 0;

  const totalScore = rawScore + completenessBonus;

  return {
    projectId: project.id,
    humanSignals,
    botSignals,
    rawScore: Math.round(rawScore * 100) / 100,
    completenessBonus: Math.round(completenessBonus * 100) / 100,
    boostBonus,
    totalScore: Math.round(totalScore * 100) / 100,
  };
}
