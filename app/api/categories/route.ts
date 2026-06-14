export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Categories error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
