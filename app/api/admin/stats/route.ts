export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const [usersCount, projectsCount, boostOrdersCount, pendingCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.boostOrder.count(),
      prisma.project.count({ where: { status: 'submitted' } }),
    ]);

    const boostOrders = await prisma.boostOrder.findMany();
    const totalRevenue = boostOrders.reduce((sum: number, o: any) => sum + (Number(o?.paymentAmount) || 0), 0);
    const totalGqi = boostOrders.reduce((sum: number, o: any) => sum + (Number(o?.impressionsDelivered) || 0), 0);

    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { evidences: true },
    });

    const users = await prisma.user.findMany({
      select: { id: true, email: true, displayName: true, role: true, subscription: true, createdAt: true },
    });

    return NextResponse.json({
      usersCount,
      projectsCount,
      boostOrdersCount,
      pendingCount,
      totalRevenue,
      totalGqi,
      projects,
      users,
      boostOrders,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
