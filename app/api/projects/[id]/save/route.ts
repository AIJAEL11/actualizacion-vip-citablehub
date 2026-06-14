export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * POST /api/projects/[id]/save
 * Toggles save/bookmark for the authenticated user.
 * Records a project_save analytics event and increments/decrements savesCount.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const projectId = params.id;
    const userId = (session.user as any).id;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Check if user already saved this project (look for existing save event)
    const existingSave = await prisma.analyticsEvent.findFirst({
      where: {
        type: 'project_save',
        projectId,
        userId,
        metadata: { path: ['active'], equals: true },
      },
    });

    if (existingSave) {
      // Unsave — mark as inactive
      await prisma.analyticsEvent.update({
        where: { id: existingSave.id },
        data: {
          metadata: {
            ...(existingSave.metadata as any ?? {}),
            active: false,
            unsavedAt: new Date().toISOString(),
          },
        },
      });

      // Decrement saves count
      await prisma.project.update({
        where: { id: projectId },
        data: { savesCount: { decrement: 1 } },
      });

      return NextResponse.json({ saved: false });
    } else {
      // Save — create event
      await prisma.analyticsEvent.create({
        data: {
          type: 'project_save',
          projectId,
          userId,
          metadata: {
            active: true,
            savedAt: new Date().toISOString(),
          },
        },
      });

      // Increment saves count
      await prisma.project.update({
        where: { id: projectId },
        data: { savesCount: { increment: 1 } },
      });

      return NextResponse.json({ saved: true });
    }
  } catch (error: any) {
    console.error('Save toggle error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET /api/projects/[id]/save
 * Check if current user has saved this project.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ saved: false });
    }

    const existingSave = await prisma.analyticsEvent.findFirst({
      where: {
        type: 'project_save',
        projectId: params.id,
        userId: (session.user as any).id,
        metadata: { path: ['active'], equals: true },
      },
    });

    return NextResponse.json({ saved: !!existingSave });
  } catch {
    return NextResponse.json({ saved: false });
  }
}
