export const dynamic = "force-dynamic";

import { Metadata } from 'next';
import CheckoutSuccessClient from '@/components/checkout-success-client';

export const metadata: Metadata = {
  title: 'Payment Successful — CitableHub',
  description: 'Your payment has been processed successfully.',
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage({ searchParams }: { searchParams: { session_id?: string; type?: string } }) {
  return <CheckoutSuccessClient sessionId={searchParams.session_id} type={searchParams.type} />;
}
