export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateMcpToken } from '@/lib/mcp/auth';

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

/** List the current user's MCP tokens (never returns the secret). */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const tokens = await prisma.mcpToken.findMany({
    where: { userId: user.id },
    select: { id: true, label: true, lastUsedAt: true, createdAt: true, revokedAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ tokens });
}

/** Create a new MCP token. The plaintext value is returned exactly once. */
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  let label = 'MCP token';
  try {
    const body = await req.json();
    if (body?.label && typeof body.label === 'string') label = body.label.slice(0, 60);
  } catch {}

  const { token, tokenHash } = generateMcpToken();
  const record = await prisma.mcpToken.create({
    data: { userId: user.id, tokenHash, label },
    select: { id: true, label: true, createdAt: true },
  });

  // `token` is returned only here and never stored in plaintext.
  return NextResponse.json({ ...record, token }, { status: 201 });
}

/** Revoke a token by id (soft-delete via revokedAt). */
export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing token id' }, { status: 400 });

  const token = await prisma.mcpToken.findUnique({ where: { id } });
  if (!token || token.userId !== user.id) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  await prisma.mcpToken.update({ where: { id }, data: { revokedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
