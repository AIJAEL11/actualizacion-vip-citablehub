import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';

/**
 * MCP Personal Access Token (PAT) auth.
 *
 * Tokens look like `chmcp_<48 hex>`. Only the SHA-256 hash is ever stored
 * (McpToken.tokenHash); the plaintext is shown to the user exactly once at
 * creation. Passwords and SSH credentials never touch this path.
 */

export const MCP_TOKEN_PREFIX = 'chmcp_';

export function generateMcpToken(): { token: string; tokenHash: string } {
  const token = MCP_TOKEN_PREFIX + randomBytes(24).toString('hex');
  return { token, tokenHash: hashMcpToken(token) };
}

export function hashMcpToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Extract a bearer token from an Authorization header value. */
export function bearerFromHeader(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const m = /^Bearer\s+(.+)$/i.exec(headerValue.trim());
  const token = m?.[1]?.trim();
  if (!token || !token.startsWith(MCP_TOKEN_PREFIX)) return null;
  return token;
}

export interface McpAuthResult {
  userId: string;
  email: string;
  tokenId: string;
}

/**
 * Resolve and validate the MCP token on a request.
 * Returns the owning user (scoping all tool calls to their own data) or null.
 */
export async function authenticateMcpRequest(req: Request): Promise<McpAuthResult | null> {
  const token = bearerFromHeader(req.headers.get('authorization'));
  if (!token) return null;

  const tokenHash = hashMcpToken(token);

  let record: any = null;
  try {
    record = await prisma.mcpToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true } } },
    });
  } catch {
    return null;
  }

  if (!record || record.revokedAt || !record.user) return null;

  // Constant-time confirmation the stored hash matches (defense in depth).
  const a = Buffer.from(record.tokenHash);
  const b = Buffer.from(tokenHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // Best-effort last-used bookkeeping (non-blocking).
  prisma.mcpToken
    .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { userId: record.user.id, email: record.user.email, tokenId: record.id };
}
