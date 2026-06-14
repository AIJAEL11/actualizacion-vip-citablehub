import { prisma } from '@/lib/db';
import { auditPlatform } from '@/lib/geo-audit';
import { generateAllAssets } from '@/lib/asset-generator';

/**
 * MCP tool definitions + handlers for the CitableHub Gateway.
 * Every handler is scoped to the authenticated user (ctx.userId): builders
 * can only register, analyze, and list their own platforms.
 */

export interface ToolContext {
  userId: string;
  email: string;
  siteUrl: string;
}

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: (args: any, ctx: ToolContext) => Promise<string>;
}

function slugify(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

async function uniquePlatformSlug(base: string, idHint: string): Promise<string> {
  const root = base || 'platform';
  const existing = await prisma.platform.findUnique({ where: { slug: root } }).catch(() => null);
  if (!existing) return root;
  return `${root}-${idHint.slice(-4)}`;
}

async function uniqueProjectSlug(base: string, idHint: string): Promise<string> {
  const root = base || 'platform';
  const existing = await prisma.project.findUnique({ where: { slug: root } }).catch(() => null);
  if (!existing) return root;
  return `${root}-${idHint.slice(-4)}`;
}

/** Load a platform owned by the current user, by id or url. */
async function getOwnedPlatform(ctx: ToolContext, ref: { platformId?: string; url?: string }): Promise<any | null> {
  if (ref.platformId) {
    const p = await prisma.platform.findUnique({ where: { id: ref.platformId } }).catch(() => null);
    return p && p.userId === ctx.userId ? p : null;
  }
  if (ref.url) {
    return prisma.platform.findFirst({ where: { userId: ctx.userId, url: ref.url } }).catch(() => null);
  }
  return null;
}

/** Ensure the platform has a public directory listing (a Project); returns its slug. */
async function materializeListing(platform: any, ctx: ToolContext): Promise<string> {
  if (platform.projectId) {
    const existing = await prisma.project.findUnique({ where: { id: platform.projectId }, select: { slug: true } }).catch(() => null);
    if (existing?.slug) return existing.slug;
  }

  const slug = await uniqueProjectSlug(slugify(platform.name), platform.id);
  const description = (platform.description || platform.name || '').toString();
  const project = await prisma.project.create({
    data: {
      name: platform.name,
      slug,
      url: platform.url,
      email: ctx.email || '',
      summary: description.slice(0, 200) || platform.name,
      description: description || platform.name,
      category: 'developer-tools',
      tags: Array.isArray(platform.stack) ? platform.stack.slice(0, 12) : [],
      status: 'registered',
      ...(Array.isArray(platform.stack) && platform.stack.length ? { platformType: platform.stack[0] } : {}),
    },
    select: { id: true, slug: true },
  });

  await prisma.platform.update({
    where: { id: platform.id },
    data: { projectId: project.id, status: 'listed', listedAt: new Date() },
  });

  // Fire-and-forget: notify IndexNow about the new public profile.
  import('@/lib/indexnow')
    .then(({ notifyProjectChange }) => notifyProjectChange(project.slug))
    .catch(() => {});

  return project.slug;
}

export const TOOLS: ToolDef[] = [
  {
    name: 'citablehub_register',
    description:
      'Register a SaaS platform with CitableHub so it can be made discoverable and citable by AI search engines. Returns the platform id and slug. Call this first.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Platform name.' },
        url: { type: 'string', description: 'Public https:// URL of the platform.' },
        description: { type: 'string', description: 'One or two sentences describing what it does and for whom.' },
        stack: { type: 'array', items: { type: 'string' }, description: 'Tech/stack tags (e.g. ["nextjs","prisma","openai"]).' },
      },
      required: ['name', 'url'],
    },
    handler: async (args, ctx) => {
      const name = (args?.name || '').toString().trim();
      const url = (args?.url || '').toString().trim();
      if (!name || !url) return 'Error: `name` and `url` are required.';
      const description = (args?.description || '').toString();
      const stack = Array.isArray(args?.stack) ? args.stack.map((s: any) => String(s)).slice(0, 24) : [];

      const existing = await prisma.platform.findFirst({ where: { userId: ctx.userId, url } }).catch(() => null);
      let platform;
      if (existing) {
        platform = await prisma.platform.update({
          where: { id: existing.id },
          data: { name, description, stack },
        });
      } else {
        const slug = await uniquePlatformSlug(slugify(name), Math.random().toString(36).slice(2));
        platform = await prisma.platform.create({
          data: { name, slug, url, description, stack, userId: ctx.userId, source: 'mcp', status: 'registered' },
        });
      }

      return [
        `✅ Registered **${platform.name}** with CitableHub.`,
        ``,
        `- platformId: \`${platform.id}\``,
        `- slug: \`${platform.slug}\``,
        `- url: ${platform.url}`,
        ``,
        `Next: run \`citablehub_analyze\` with this platformId to get a GEO score, then \`citablehub_generate\` and \`citablehub_listing\`.`,
      ].join('\n');
    },
  },
  {
    name: 'citablehub_analyze',
    description:
      'Audit a registered platform and return its GEO (Generative Engine Optimization) score from 0-100 with a per-dimension breakdown and concrete recommendations. Performs live checks of robots.txt, llms.txt, and ai-plugin.json.',
    inputSchema: {
      type: 'object',
      properties: {
        platformId: { type: 'string', description: 'The platform id returned by citablehub_register.' },
        url: { type: 'string', description: 'Alternatively, the platform URL you previously registered.' },
      },
    },
    handler: async (args, ctx) => {
      const platform = await getOwnedPlatform(ctx, { platformId: args?.platformId, url: args?.url });
      if (!platform) return 'Error: platform not found for your account. Run `citablehub_register` first.';

      const result = await auditPlatform({
        name: platform.name,
        url: platform.url,
        description: platform.description,
        stack: platform.stack,
      });

      await prisma.geoAudit.create({
        data: { platformId: platform.id, score: result.score, breakdown: result.breakdown as any, source: 'mcp' },
      }).catch(() => {});
      await prisma.platform.update({
        where: { id: platform.id },
        data: { geoScore: result.score, status: platform.status === 'listed' ? 'listed' : 'analyzed' },
      }).catch(() => {});

      const lines = [
        `## GEO Score for ${platform.name}: ${result.score}/100`,
        ``,
        `| Dimension | Score |`,
        `|---|---|`,
        ...result.breakdown.map((d) => `| ${d.label} | ${d.score}/100 |`),
      ];
      if (result.recommendations.length) {
        lines.push(``, `### Recommendations`, ...result.recommendations.map((r) => `- ${r}`));
      }
      lines.push(``, `Run \`citablehub_generate\` to get llms.txt + ai-plugin.json + FAQ schema that fix most of these.`);
      return lines.join('\n');
    },
  },
  {
    name: 'citablehub_generate',
    description:
      'Generate ready-to-paste GEO assets for a registered platform: llms.txt, /.well-known/ai-plugin.json, and a FAQPage JSON-LD block.',
    inputSchema: {
      type: 'object',
      properties: { platformId: { type: 'string', description: 'The platform id from citablehub_register.' } },
      required: ['platformId'],
    },
    handler: async (args, ctx) => {
      const platform = await getOwnedPlatform(ctx, { platformId: args?.platformId });
      if (!platform) return 'Error: platform not found for your account.';

      const assets = generateAllAssets({
        name: platform.name,
        url: platform.url,
        description: platform.description,
        stack: platform.stack,
        slug: platform.slug,
      });

      return [
        `Generated GEO assets for **${platform.name}**. Paste each at the indicated path:`,
        ``,
        `### 1. /llms.txt`,
        '```text',
        assets.llmsTxt,
        '```',
        ``,
        `### 2. /.well-known/ai-plugin.json`,
        '```json',
        assets.aiPluginJson,
        '```',
        ``,
        `### 3. FAQPage JSON-LD (embed in a <script type="application/ld+json"> on your homepage)`,
        '```json',
        assets.faqSchema,
        '```',
      ].join('\n');
    },
  },
  {
    name: 'citablehub_badge',
    description:
      'Return the embeddable "Citable Verified" badge for a platform (HTML + Markdown). The badge links back to the platform\'s CitableHub profile, creating a backlink. Lists the platform publicly if not already listed.',
    inputSchema: {
      type: 'object',
      properties: { platformId: { type: 'string', description: 'The platform id from citablehub_register.' } },
      required: ['platformId'],
    },
    handler: async (args, ctx) => {
      const platform = await getOwnedPlatform(ctx, { platformId: args?.platformId });
      if (!platform) return 'Error: platform not found for your account.';

      const projectSlug = await materializeListing(platform, ctx);
      const profileUrl = `${ctx.siteUrl}/p/${projectSlug}`;
      const badgeUrl = `${ctx.siteUrl}/api/badge/${projectSlug}`;
      const alt = `Citable Verified — ${platform.name} on CitableHub`;
      const html = `<a href="${profileUrl}" target="_blank" rel="noopener"><img src="${badgeUrl}" alt="${alt}" height="20" /></a>`;
      const markdown = `[![${alt}](${badgeUrl})](${profileUrl})`;

      await prisma.badge.upsert({
        where: { platformId: platform.id },
        update: { embedCode: html },
        create: { platformId: platform.id, embedCode: html, verifiedAt: new Date() },
      }).catch(() => {});

      return [
        `Embed the "Citable Verified" badge for **${platform.name}**:`,
        ``,
        `### HTML`,
        '```html',
        html,
        '```',
        ``,
        `### Markdown`,
        '```markdown',
        markdown,
        '```',
        ``,
        `Live preview & profile: ${profileUrl}`,
      ].join('\n');
    },
  },
  {
    name: 'citablehub_listing',
    description:
      'Create or refresh the public CitableHub directory listing for a registered platform. Returns the public profile URL where AIs will find and cite it.',
    inputSchema: {
      type: 'object',
      properties: { platformId: { type: 'string', description: 'The platform id from citablehub_register.' } },
      required: ['platformId'],
    },
    handler: async (args, ctx) => {
      const platform = await getOwnedPlatform(ctx, { platformId: args?.platformId });
      if (!platform) return 'Error: platform not found for your account.';

      const slug = await materializeListing(platform, ctx);
      const profileUrl = `${ctx.siteUrl}/p/${slug}`;
      return [
        `✅ **${platform.name}** is now listed in the public CitableHub directory.`,
        ``,
        `- Public profile: ${profileUrl}`,
        `- It is included in the sitemap and crawlable by GPTBot, ClaudeBot, PerplexityBot, and others.`,
        ``,
        `Run \`citablehub_badge\` to get an embeddable badge that backlinks here.`,
      ].join('\n');
    },
  },
];

export const TOOLS_BY_NAME: Record<string, ToolDef> = Object.fromEntries(TOOLS.map((t) => [t.name, t]));
