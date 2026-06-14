export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { stripe, PLANS, BOOST_PACKAGES, BOOST_DURATIONS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { type, planId, boostPackId, projectId, projectName, projectUrl, projectEmail, category } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.displayName || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const origin = request.headers.get('origin') || 'https://citablehub.com';

    if (type === 'subscription') {
      // Subscriptions removed — platform is free
      return NextResponse.json({ error: 'Subscriptions are no longer available. CitableHub is free!' }, { status: 400 });
    }

    if (type === 'boost') {
      // Boost one-time payment checkout
      const pack = BOOST_PACKAGES[boostPackId];
      if (!pack) {
        return NextResponse.json({ error: 'Invalid boost package' }, { status: 400 });
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `GQI Boost: ${pack.name}`,
                description: `${pack.gqi.toLocaleString()} Guaranteed Qualified Impressions`,
              },
              unit_amount: pack.price,
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=boost`,
        cancel_url: `${origin}/?tab=boost`,
        metadata: {
          userId: user.id,
          type: 'boost',
          boostPackId,
          projectId: projectId || '',
          projectName: projectName || '',
          projectUrl: projectUrl || '',
          projectEmail: projectEmail || user.email,
          category: category || 'developer-tools',
          gqi: String(pack.gqi),
          durationDays: String(BOOST_DURATIONS[boostPackId] || 7),
        },
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error?.message || 'Checkout failed' }, { status: 500 });
  }
}
