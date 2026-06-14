export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// POST /api/projects/claim — Request to claim a project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required. Please sign in to claim a project.' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });
    }

    // Find project
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    if (!project.claimable) {
      return NextResponse.json({ error: 'This project is not available for claiming.' }, { status: 400 });
    }

    if (project.ownerId) {
      return NextResponse.json({ error: 'This project has already been claimed.' }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Check for existing pending claim
    const existingClaim = await prisma.claimRequest.findFirst({
      where: { projectId, userId: user.id, status: 'pending' },
    });
    if (existingClaim) {
      return NextResponse.json({ error: 'You already have a pending claim for this project.' }, { status: 400 });
    }

    // Create claim request
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const claim = await prisma.claimRequest.create({
      data: {
        projectId,
        userId: user.id,
        method: 'email',
        status: 'pending',
        verifyToken,
      },
    });

    // For MVP, auto-approve the claim (in production, you'd send verification email)
    await prisma.claimRequest.update({
      where: { id: claim.id },
      data: { status: 'approved', verifiedAt: new Date() },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        ownerId: user.id,
        claimable: false,
        status: 'registered',
        email: session.user.email,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        email: session.user.email,
        action: 'project_claimed',
        details: `User claimed project: ${project.name} (${project.slug})`,
      },
    });

    // Fire-and-forget: notify IndexNow about claimed profile
    if (project.slug) {
      import('@/lib/indexnow').then(({ notifyProjectChange }) =>
        notifyProjectChange(project.slug)
      ).catch((e) => console.error('[IndexNow] claim hook error:', e));
    }

    return NextResponse.json({
      success: true,
      message: `You have successfully claimed "${project.name}". Welcome aboard!`,
      project: { id: project.id, name: project.name, slug: project.slug, status: 'registered' },
    });
  } catch (error: any) {
    console.error('Claim error:', error);
    return NextResponse.json({ error: 'Failed to process claim request.' }, { status: 500 });
  }
}

// GET /api/projects/claim?projectId=xxx — Check claim status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const projectId = req.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required.' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    let userClaim = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (user) {
        userClaim = await prisma.claimRequest.findFirst({
          where: { projectId, userId: user.id },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    return NextResponse.json({
      claimable: project.claimable,
      claimed: !!project.ownerId,
      status: project.status,
      userClaim: userClaim ? { status: userClaim.status, createdAt: userClaim.createdAt } : null,
    });
  } catch (error: any) {
    console.error('Claim status error:', error);
    return NextResponse.json({ error: 'Failed to check claim status.' }, { status: 500 });
  }
}
