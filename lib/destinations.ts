/**
 * Destination system for project promotion.
 * Filterable by category/tags.
 */

export interface Destination {
  id: string;
  name: string;
  url: string;
  verticals: string[];  // matching category IDs
  requiredFields: string[];
  notes: string;
  icon: string; // emoji
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'producthunt',
    name: 'Product Hunt',
    url: 'https://www.producthunt.com/posts/new',
    verticals: ['developer-tools', 'ai-ml', 'saas', 'productivity', 'design', 'marketing', 'analytics', 'fintech', 'healthtech', 'edtech', 'ecommerce', 'devops', 'cybersecurity', 'data-science', 'communication', 'no-code', 'web3'],
    requiredFields: ['name', 'url', 'summary', 'description', 'logoUrl'],
    notes: 'Best for launches. Include a catchy tagline and maker story.',
    icon: '🚀',
  },
  {
    id: 'hackernews',
    name: 'Hacker News (Show HN)',
    url: 'https://news.ycombinator.com/submitlink',
    verticals: ['developer-tools', 'ai-ml', 'devops', 'cybersecurity', 'data-science', 'web3', 'saas'],
    requiredFields: ['name', 'url', 'summary'],
    notes: 'Use "Show HN: [Name] – [One-liner]". Keep it technical.',
    icon: '📰',
  },
  {
    id: 'betalist',
    name: 'BetaList',
    url: 'https://betalist.com/submit',
    verticals: ['developer-tools', 'ai-ml', 'saas', 'productivity', 'design', 'marketing', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'no-code'],
    requiredFields: ['name', 'url', 'summary', 'description'],
    notes: 'Great for early-stage startups. Focus on the problem you solve.',
    icon: '🧪',
  },
  {
    id: 'indiehackers',
    name: 'Indie Hackers',
    url: 'https://www.indiehackers.com/new-product',
    verticals: ['developer-tools', 'saas', 'productivity', 'ecommerce', 'marketing', 'no-code', 'ai-ml'],
    requiredFields: ['name', 'url', 'summary', 'outcome'],
    notes: 'Share your indie journey. Revenue and growth stories work best.',
    icon: '💡',
  },
  {
    id: 'devto',
    name: 'DEV.to',
    url: 'https://dev.to/new',
    verticals: ['developer-tools', 'ai-ml', 'devops', 'data-science', 'cybersecurity', 'web3'],
    requiredFields: ['name', 'url', 'description', 'tags'],
    notes: 'Write a "How I built" or tutorial article. Tag with relevant topics.',
    icon: '✍️',
  },
  {
    id: 'reddit',
    name: 'Reddit (r/SideProject)',
    url: 'https://www.reddit.com/r/SideProject/submit',
    verticals: ['developer-tools', 'ai-ml', 'saas', 'productivity', 'design', 'marketing', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'no-code', 'web3', 'devops', 'analytics', 'communication', 'cybersecurity', 'data-science'],
    requiredFields: ['name', 'url', 'summary'],
    notes: 'Be genuine, share your story. Avoid marketing language.',
    icon: '🤖',
  },
  {
    id: 'alternativeto',
    name: 'AlternativeTo',
    url: 'https://alternativeto.net/manage/new/',
    verticals: ['developer-tools', 'saas', 'productivity', 'design', 'communication', 'analytics', 'cybersecurity', 'no-code'],
    requiredFields: ['name', 'url', 'description', 'tags'],
    notes: 'Position yourself as an alternative to known tools. Add screenshots.',
    icon: '🔄',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Post',
    url: 'https://www.linkedin.com/feed/',
    verticals: ['developer-tools', 'ai-ml', 'saas', 'productivity', 'design', 'marketing', 'analytics', 'fintech', 'healthtech', 'edtech', 'ecommerce', 'devops', 'cybersecurity', 'data-science', 'communication', 'no-code', 'web3'],
    requiredFields: ['name', 'url', 'summary', 'outcome'],
    notes: 'Share your launch story. Tag relevant people. Use the short description.',
    icon: '💼',
  },
  {
    id: 'twitter',
    name: 'X / Twitter Launch',
    url: 'https://twitter.com/intent/tweet',
    verticals: ['developer-tools', 'ai-ml', 'saas', 'productivity', 'design', 'marketing', 'analytics', 'fintech', 'healthtech', 'edtech', 'ecommerce', 'devops', 'cybersecurity', 'data-science', 'communication', 'no-code', 'web3'],
    requiredFields: ['name', 'url', 'summary'],
    notes: 'Use the one-liner + link. Tag relevant accounts.',
    icon: '🐦',
  },
  {
    id: 'g2',
    name: 'G2',
    url: 'https://www.g2.com/products/new',
    verticals: ['saas', 'productivity', 'marketing', 'analytics', 'cybersecurity', 'communication', 'ecommerce', 'fintech'],
    requiredFields: ['name', 'url', 'description', 'logoUrl'],
    notes: 'Focus on enterprise use cases. Reviews from real users boost ranking.',
    icon: '⭐',
  },
];

/**
 * Get destinations matching project category and tags.
 */
export function getRecommendedDestinations(
  category: string,
  tags: string[],
  limit = 5
): Destination[] {
  const cat = (category || '').toLowerCase();

  // Score destinations by relevance
  const scored = DESTINATIONS.map(d => {
    let score = 0;
    if (d.verticals.includes(cat)) score += 3;
    // Bonus for matching tags in verticals
    for (const t of tags || []) {
      if (d.verticals.some(v => v.includes(t) || t.includes(v))) score += 1;
    }
    return { ...d, score };
  });

  return scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
