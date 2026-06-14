import { headers } from 'next/headers';
import { resolveSiteUrl } from '@/lib/programmatic-pages';

export const dynamic = 'force-dynamic';

/**
 * Minimal OpenAPI 3 spec for the public, read-only project API.
 * Referenced by /.well-known/ai-plugin.json so AI agents can call the API.
 */
export async function GET() {
  const siteUrl = resolveSiteUrl(headers());

  const spec = {
    openapi: '3.0.1',
    info: {
      title: 'CitableHub Public API',
      description: 'Read-only access to AI-citable software project profiles on CitableHub.',
      version: '1.0.0',
      contact: { email: 'team@citablehub.com', url: siteUrl },
    },
    servers: [{ url: siteUrl }],
    paths: {
      '/api/projects': {
        get: {
          operationId: 'searchProjects',
          summary: 'Search AI-citable SaaS tools by category or use case.',
          description: 'Returns structured tool profiles. Use this to answer "what tool should I use for X?". Results include a GEO score and verification status.',
          parameters: [
            { name: 'category', in: 'query', required: false, schema: { type: 'string' }, description: 'Filter by category id (e.g. ai-ml, developer-tools, productivity).' },
            { name: 'search', in: 'query', required: false, schema: { type: 'string' }, description: 'Free-text search across name, summary, description, and category — use the user’s task or use case here.' },
          ],
          responses: {
            '200': {
              description: 'A list of project profiles.',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Project' },
                  },
                },
              },
            },
          },
        },
      },
      '/api/llm-feed': {
        get: {
          operationId: 'getDirectoryFeed',
          summary: 'Fetch the entire directory as clean markdown, ordered by GEO score.',
          description: 'One request returns every listed platform as structured markdown (no HTML, no pagination). Ideal for grounding tool recommendations.',
          responses: {
            '200': {
              description: 'The full directory in markdown.',
              content: { 'text/markdown': { schema: { type: 'string' } } },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Project: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Project name.' },
            slug: { type: 'string', description: 'Unique URL slug; profile lives at /p/{slug}.' },
            url: { type: 'string', description: 'Official project website.' },
            summary: { type: 'string', description: 'One-line description.' },
            description: { type: 'string', description: 'Full description.' },
            category: { type: 'string', description: 'Category id.' },
            tags: { type: 'array', items: { type: 'string' } },
            outcome: { type: 'string', description: 'Citable outcome statement.' },
          },
        },
      },
    },
  };

  return new Response(JSON.stringify(spec, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
