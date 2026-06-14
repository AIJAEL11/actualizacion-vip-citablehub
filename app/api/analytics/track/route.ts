export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Known bot user-agent patterns
const BOT_PATTERNS = /bot|crawl|spider|slurp|semrush|ahref|mj12|dotbot|petalbot|bingpreview|yandex|baidu|duckduck|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|gptbot|google-extended|anthropic|claude|bytespider|amazonbot|applebot|ia_archiver|archive\.org/i;

function classifyAgent(ua: string): 'bot' | 'human' {
  if (!ua) return 'human';
  return BOT_PATTERNS.test(ua) ? 'bot' : 'human';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, projectId, metadata } = body ?? {};

    if (!type) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 });
    }

    const ua = req.headers.get('user-agent') || '';
    const agentClass = classifyAgent(ua);

    // Fire and forget — don't block the response
    prisma.analyticsEvent.create({
      data: {
        type,
        projectId: projectId || null,
        metadata: {
          ...(metadata ?? {}),
          ua: ua.slice(0, 200),
          agentClass,
        },
      },
    }).catch((e: any) => console.warn('Analytics track error:', e));

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ ok: true }); // Don't fail on analytics
  }
}
