import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil' as any,
});

// Subscription plans removed — platform is 100% free
// Revenue comes from one-time GQI Boost purchases only
export const PLANS: Record<string, any> = {}; // Legacy — kept for import compat

export const BOOST_PACKAGES: Record<string, { name: string; gqi: number; price: number; desc: string }> = {
  starter: { name: 'Starter', gqi: 2000, price: 10000, desc: 'Perfect for early-stage launches.' },
  launch: { name: 'Launch', gqi: 6000, price: 25000, desc: 'Accelerate your market presence.' },
  growth: { name: 'Growth', gqi: 15000, price: 50000, desc: 'Maximum discovery exposure.' },
};

// Boost durations in days
export const BOOST_DURATIONS: Record<string, number> = {
  starter: 1,  // 24h
  launch: 7,   // 7 days
  growth: 30,  // 30 days
};
