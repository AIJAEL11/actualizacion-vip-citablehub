export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing Stripe webhook signature or secret');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err?.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        if (metadata.type === 'subscription') {
          // Handle subscription activation
          const userId = metadata.userId;
          const planId = metadata.planId;
          if (userId && planId) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                subscription: planId,
                stripeSubscriptionId: (session as any).subscription as string || null,
                subscriptionStatus: 'active',
              },
            });
            console.log(`Subscription activated: user=${userId}, plan=${planId}`);
          }
        } else if (metadata.type === 'boost') {
          // Handle boost purchase
          const userId = metadata.userId;
          const durationDays = parseInt(metadata.durationDays || '7', 10);
          const gqi = parseInt(metadata.gqi || '0', 10);
          const now = new Date();
          const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

          // Create boost order
          const boostOrder = await prisma.boostOrder.create({
            data: {
              userId: userId || null,
              projectId: metadata.projectId || null,
              url: metadata.projectUrl || '',
              email: metadata.projectEmail || '',
              projectName: metadata.projectName || '',
              category: metadata.category || 'developer-tools',
              packType: metadata.boostPackId || 'launch',
              gqiLimit: gqi,
              totalGQIRequired: gqi,
              paymentAmount: (session.amount_total || 0) / 100,
              stripeSessionId: session.id,
              stripePaymentIntentId: (session as any).payment_intent as string || null,
              status: 'active',
              boostStartDate: now,
              boostEndDate: endDate,
            },
          });

          // Update project boost score if projectId provided
          if (metadata.projectId) {
            // boostScore = normalized value 0-1 based on GQI
            const boostScore = Math.min(gqi / 15000, 1.0);
            await prisma.project.update({
              where: { id: metadata.projectId },
              data: { boostScore },
            });
          }

          console.log(`Boost order created: ${boostOrder.id}, gqi=${gqi}, ends=${endDate.toISOString()}`);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        if (subscriptionId) {
          // Find user with this subscription and ensure active
          const user = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { subscriptionStatus: 'active' },
            });
            console.log(`Invoice paid: subscription renewed for user=${user.id}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        if (subscriptionId) {
          const user = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionStatus: 'past_due',
                subscription: 'free', // Restrict to free
              },
            });
            console.log(`Payment failed: user=${user.id} downgraded to free`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscription: 'free',
              subscriptionStatus: 'cancelled',
              stripeSubscriptionId: null,
            },
          });
          console.log(`Subscription cancelled: user=${user.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
