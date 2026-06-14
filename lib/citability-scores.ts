/**
 * Modular Citability & Trust Sub-Score System.
 * All scores are 0-100. Calculated from visible project data only.
 * No fabricated metrics — each score reflects what's actually filled.
 */

export interface SubScores {
  identity: number;
  evidence: number;
  trust: number;
  freshness: number;
  classification: number;
  overall: number;
}

export interface SubScoreDetail {
  label: string;
  score: number;
  maxScore: number;
  color: string;
  items: { label: string; met: boolean; weight: number }[];
}

function safeStr(v: any): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

function safeArr(v: any): boolean {
  return Array.isArray(v) && v.length > 0;
}

function safeObj(v: any): boolean {
  if (!v || typeof v !== 'object') return false;
  return Object.keys(v).length > 0;
}

/** Identity Score: How well the project identifies itself */
export function getIdentityScore(p: any): SubScoreDetail {
  const items = [
    { label: 'Project name', met: safeStr(p?.name), weight: 20 },
    { label: 'Website URL', met: safeStr(p?.url), weight: 20 },
    { label: 'Logo', met: safeStr(p?.logoUrl), weight: 15 },
    { label: 'Summary', met: safeStr(p?.summary) && (p?.summary?.length ?? 0) >= 15, weight: 20 },
    { label: 'Founder / Team', met: safeStr(p?.founderName), weight: 15 },
    { label: 'Social links', met: safeObj(p?.socialLinks), weight: 10 },
  ];
  const score = items.reduce((s, i) => s + (i.met ? i.weight : 0), 0);
  return { label: 'Identity', score, maxScore: 100, color: '#6D28D9', items };
}

/** Evidence Score: How well the project proves its claims */
export function getEvidenceScore(p: any): SubScoreDetail {
  const hasEvidences = safeArr(p?.evidences) && p.evidences.length > 0;
  const hasMultiple = safeArr(p?.evidences) && p.evidences.length >= 2;
  const items = [
    { label: 'Citable outcome', met: safeStr(p?.outcome) && (p?.outcome?.length ?? 0) >= 15, weight: 30 },
    { label: 'At least one evidence link', met: hasEvidences, weight: 25 },
    { label: 'Multiple evidence sources', met: hasMultiple, weight: 15 },
    { label: 'Demo URL', met: safeStr(p?.demoUrl), weight: 15 },
    { label: 'Description', met: safeStr(p?.description) && (p?.description?.length ?? 0) >= 40, weight: 15 },
  ];
  const score = items.reduce((s, i) => s + (i.met ? i.weight : 0), 0);
  return { label: 'Evidence', score, maxScore: 100, color: '#059669', items };
}

/** Trust Score: Transparency & verifiability signals */
export function getTrustScore(p: any): SubScoreDetail {
  const items = [
    { label: 'Contact information', met: safeStr(p?.email) || safeStr(p?.contactUrl), weight: 20 },
    { label: 'Support URL', met: safeStr(p?.supportUrl), weight: 15 },
    { label: 'Privacy policy', met: safeStr(p?.privacyUrl), weight: 15 },
    { label: 'Terms of service', met: safeStr(p?.termsUrl), weight: 15 },
    { label: 'Verified status', met: p?.status === 'verified' || p?.verificationStatus === 'verified', weight: 20 },
    { label: 'Target audience defined', met: safeStr(p?.targetAudience) && (p?.targetAudience?.length ?? 0) >= 10, weight: 15 },
  ];
  const score = items.reduce((s, i) => s + (i.met ? i.weight : 0), 0);
  return { label: 'Trust', score, maxScore: 100, color: '#2563EB', items };
}

/** Freshness Score: How up-to-date the profile is */
export function getFreshnessScore(p: any): SubScoreDetail {
  const now = Date.now();
  const updatedAt = p?.updatedAt ? new Date(p.updatedAt).getTime() : 0;
  const lastReviewed = p?.lastReviewed ? new Date(p.lastReviewed).getTime() : 0;
  const daysSinceUpdate = updatedAt ? Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24)) : 999;
  const daysSinceReview = lastReviewed ? Math.floor((now - lastReviewed) / (1000 * 60 * 60 * 24)) : 999;

  const items = [
    { label: 'Updated within 30 days', met: daysSinceUpdate <= 30, weight: 30 },
    { label: 'Updated within 90 days', met: daysSinceUpdate <= 90, weight: 20 },
    { label: 'Has version number', met: safeStr(p?.version), weight: 15 },
    { label: 'Launch date provided', met: !!p?.launchDate, weight: 15 },
    { label: 'Reviewed within 90 days', met: daysSinceReview <= 90, weight: 20 },
  ];
  const score = items.reduce((s, i) => s + (i.met ? i.weight : 0), 0);
  return { label: 'Freshness', score, maxScore: 100, color: '#D97706', items };
}

/** Classification Score: How well the project is categorized */
export function getClassificationScore(p: any): SubScoreDetail {
  const items = [
    { label: 'Category set', met: safeStr(p?.category), weight: 20 },
    { label: 'At least 2 tags', met: safeArr(p?.tags) && p.tags.length >= 2, weight: 20 },
    { label: 'Use-case tags', met: safeArr(p?.useCaseTags) && p.useCaseTags.length > 0, weight: 20 },
    { label: 'Audience tags', met: safeArr(p?.audienceTags) && p.audienceTags.length > 0, weight: 15 },
    { label: 'Industry tags', met: safeArr(p?.industryTags) && p.industryTags.length > 0, weight: 15 },
    { label: 'Platform type', met: safeStr(p?.platformType), weight: 10 },
  ];
  const score = items.reduce((s, i) => s + (i.met ? i.weight : 0), 0);
  return { label: 'Classification', score, maxScore: 100, color: '#DC2626', items };
}

/** Calculate all sub-scores and overall */
export function getAllSubScores(p: any): SubScores {
  const identity = getIdentityScore(p).score;
  const evidence = getEvidenceScore(p).score;
  const trust = getTrustScore(p).score;
  const freshness = getFreshnessScore(p).score;
  const classification = getClassificationScore(p).score;

  // Weighted overall: Evidence & Identity matter most for AI citability
  const overall = Math.round(
    identity * 0.25 +
    evidence * 0.30 +
    trust * 0.20 +
    freshness * 0.10 +
    classification * 0.15
  );

  return { identity, evidence, trust, freshness, classification, overall };
}

/** Get all sub-score details for display */
export function getAllSubScoreDetails(p: any): SubScoreDetail[] {
  return [
    getIdentityScore(p),
    getEvidenceScore(p),
    getTrustScore(p),
    getFreshnessScore(p),
    getClassificationScore(p),
  ];
}
