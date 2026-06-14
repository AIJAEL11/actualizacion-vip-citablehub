export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const intents = await prisma.intentTag.findMany();
    return NextResponse.json(intents);
  } catch (error: any) {
    console.error('Intents error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
