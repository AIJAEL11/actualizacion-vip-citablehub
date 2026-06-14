export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { id: params?.id },
          { slug: params?.id },
        ],
      },
      include: {
        evidences: true,
        projectUpdates: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Increment impressions
    try {
      await prisma.project.update({
        where: { id: project.id },
        data: { impressions: { increment: 1 } },
      });
    } catch {}

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Project GET error:', error);
    return NextResponse.json({ error: 'Failed to load project' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const project = await prisma.project.findUnique({ where: { id: params?.id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only owner or admin can update
    if (project.ownerId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = ['name', 'summary', 'description', 'outcome', 'targetAudience', 'category', 'tags', 'url', 'email', 'logoUrl', 'coverUrl', 'status', 'verificationStatus', 'platformPartner', 'isSeeded', 'boostScore', 'trustScore', 'founderName', 'demoUrl', 'supportUrl', 'privacyUrl', 'termsUrl', 'contactUrl', 'version', 'alternatives', 'differentiators', 'notIdealFor', 'useCaseTags', 'audienceTags', 'industryTags', 'platformType', 'businessType', 'socialLinks'];
    const data: any = {};
    for (const field of allowedFields) {
      if (body?.[field] !== undefined) data[field] = body[field];
    }
    const updatedProject = await prisma.project.update({
      where: { id: params?.id },
      data,
    });

    // Fire-and-forget: trigger completeness notification
    (async () => {
      try {
        const { triggerCompletenessReminder } = await import('@/lib/notifications');
        await triggerCompletenessReminder(user.id, user.email, updatedProject);
      } catch (e) { console.error('[Notif trigger] completeness:', e); }
    })();

    // Fire-and-forget: notify IndexNow about updated profile
    if (updatedProject.slug) {
      import('@/lib/indexnow').then(({ notifyProjectChange }) =>
        notifyProjectChange(updatedProject.slug)
      ).catch((e) => console.error('[IndexNow] edit hook error:', e));
    }

    return NextResponse.json(updatedProject);
  } catch (error: any) {
    console.error('Project PATCH error:', error);
    return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 });
  }
}
