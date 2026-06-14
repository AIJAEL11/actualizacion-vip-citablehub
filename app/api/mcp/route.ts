export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/lib/mcp/auth';
import { TOOLS, TOOLS_BY_NAME, ToolContext } from '@/lib/mcp/tools';
import { resolveSiteUrl } from '@/lib/programmatic-pages';

/**
 * CitableHub MCP Gateway — a stateless Streamable-HTTP MCP server.
 *
 * Implements the JSON-RPC 2.0 subset MCP clients need for tools:
 * initialize, notifications/initialized, ping, tools/list, tools/call.
 * No external dependency — kept deliberately small and spec-correct.
 *
 * Connect from Claude Code:
 *   claude mcp add --transport http citablehub https://citablehub.com/api/mcp \
 *     --header "Authorization: Bearer chmcp_..."
 */

const DEFAULT_PROTOCOL = '2025-06-18';
const SERVER_INFO = { name: 'citablehub', version: '1.0.0' };

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function rpcResult(id: any, result: any) {
  return { jsonrpc: '2.0', id, result };
}
function rpcError(id: any, code: number, message: string, data?: any) {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

async function handleSingle(msg: any, ctx: { auth: Awaited<ReturnType<typeof authenticateMcpRequest>>; siteUrl: string }): Promise<any | null> {
  // Notifications (no id) get no response.
  const isNotification = msg && msg.id === undefined;
  const id = msg?.id ?? null;

  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return isNotification ? null : rpcError(id, -32600, 'Invalid Request');
  }

  switch (msg.method) {
    case 'initialize': {
      const requested = msg.params?.protocolVersion;
      return rpcResult(id, {
        protocolVersion: typeof requested === 'string' ? requested : DEFAULT_PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'Use citablehub_register first, then citablehub_analyze, citablehub_generate, citablehub_listing, and citablehub_badge. All tools act only on platforms owned by the authenticated token.',
      });
    }

    case 'notifications/initialized':
    case 'initialized':
      return null; // acknowledge silently

    case 'ping':
      return rpcResult(id, {});

    case 'tools/list':
      return rpcResult(id, {
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
      });

    case 'tools/call': {
      if (!ctx.auth) {
        return rpcError(id, -32001, 'Unauthorized: missing or invalid MCP token. Generate one at /mcp and pass it as "Authorization: Bearer chmcp_...".');
      }
      const name = msg.params?.name;
      const tool = TOOLS_BY_NAME[name];
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${name}`);

      const toolCtx: ToolContext = { userId: ctx.auth.userId, email: ctx.auth.email, siteUrl: ctx.siteUrl };
      try {
        const text = await tool.handler(msg.params?.arguments ?? {}, toolCtx);
        return rpcResult(id, { content: [{ type: 'text', text }] });
      } catch (e: any) {
        return rpcResult(id, { content: [{ type: 'text', text: `Tool error: ${e?.message || 'unknown error'}` }], isError: true });
      }
    }

    default:
      return isNotification ? null : rpcError(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, 'Parse error'), { status: 200, headers: JSON_HEADERS });
  }

  const auth = await authenticateMcpRequest(req);
  const siteUrl = resolveSiteUrl(req.headers);
  const ctx = { auth, siteUrl };

  // Support JSON-RPC batches.
  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map((m) => handleSingle(m, ctx)))).filter((r) => r !== null);
    return NextResponse.json(responses, { status: 200, headers: JSON_HEADERS });
  }

  const response = await handleSingle(body, ctx);
  if (response === null) {
    // Notification — no body.
    return new Response(null, { status: 202, headers: JSON_HEADERS });
  }
  return NextResponse.json(response, { status: 200, headers: JSON_HEADERS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

// This stateless server does not offer a server-initiated SSE stream on GET.
export async function GET() {
  return NextResponse.json(
    { server: SERVER_INFO, transport: 'streamable-http', message: 'POST JSON-RPC 2.0 to this endpoint. See /mcp for setup.' },
    { status: 405, headers: { ...JSON_HEADERS, Allow: 'POST, OPTIONS' } },
  );
}
