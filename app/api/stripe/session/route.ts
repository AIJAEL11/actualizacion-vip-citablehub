export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata = session.metadata || {};

    const response: any = {
      status: session.status,
      customerEmail: session.customer_details?.email || session.customer_email,
      amount: session.amount_total,
      currency: session.currency,
    };

    if (metadata.type === 'subscription') {
      const planId = metadata.planId || '';
      response.planName = planId.charAt(0).toUpperCase() + planId.slice(1);
    } else if (metadata.type === 'boost') {
      response.boostProject = metadata.projectName || '';
      response.boostGqi = metadata.gqi || '0';
      response.boostDuration = metadata.durationDays || '7';
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Session retrieve error:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
