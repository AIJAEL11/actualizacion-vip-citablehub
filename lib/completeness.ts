/**
 * Calculate project profile completeness (0-1 scale).
 * Expanded to include new trust/citability fields.
 * Core fields (8): name, url, summary, description, outcome, targetAudience, logoUrl, tags
 * Trust fields (6): founderName, demoUrl, supportUrl, evidences, version, alternatives
 * Core = 70% weight, Trust = 30% weight
 */
export function getCompleteness(project: any): number {
  if (!project) return 0;
  const coreFields = [
    !!project.name?.trim(),
    !!project.url?.trim(),
    !!project.summary?.trim(),
    !!project.description?.trim(),
    !!project.outcome?.trim(),
    !!project.targetAudience?.trim(),
    !!project.logoUrl,
    Array.isArray(project.tags) ? project.tags.length > 0 : !!project.tags?.trim(),
  ];
  const trustFields = [
    !!project.founderName?.trim(),
    !!project.demoUrl?.trim(),
    !!project.supportUrl?.trim(),
    Array.isArray(project.evidences) ? project.evidences.length > 0 : false,
    !!project.version?.trim(),
    Array.isArray(project.alternatives) ? project.alternatives.length > 0 : false,
  ];
  const coreFilled = coreFields.filter(Boolean).length / coreFields.length;
  const trustFilled = trustFields.filter(Boolean).length / trustFields.length;
  return coreFilled * 0.7 + trustFilled * 0.3;
}
