export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const usersCount = await prisma.user.count();
    const projectsCount = await prisma.project.count();

    return NextResponse.json({
      status: 'healthy',
      platform: 'CitableHub',
      version: '2.0.0',
      usersCount,
      projectsCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', error: error?.message }, { status: 500 });
  }
}
