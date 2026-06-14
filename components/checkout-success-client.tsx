"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Crown, Zap, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface CheckoutSuccessClientProps {
  sessionId?: string;
  type?: string;
}

interface SessionDetails {
  customerEmail?: string;
  planName?: string;
  amount?: number;
  currency?: string;
  boostGqi?: string;
  boostProject?: string;
  boostDuration?: string;
  status?: string;
}

export default function CheckoutSuccessClient({ sessionId, type }: CheckoutSuccessClientProps) {
  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/stripe/session?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) setDetails(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const isBoost = type === 'boost';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-10 text-center space-y-6 shadow-lg">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </motion.div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground">
              {isBoost
                ? 'Your GQI Boost campaign is now active.'
                : 'Your subscription has been activated.'}
            </p>
          </div>

          {/* Details Card */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading details...</span>
            </div>
          ) : details ? (
            <div className="bg-muted/50 rounded-xl p-5 space-y-3 text-left">
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                {isBoost ? <Zap className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
                {isBoost ? 'GQI Boost Campaign' : `${details.planName || 'Subscription'} Plan`}
              </div>

              <div className="space-y-2 text-sm">
                {details.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-mono text-xs">{details.customerEmail}</span>
                  </div>
                )}

                {details.amount != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold text-lg">
                      ${(details.amount / 100).toFixed(2)} {(details.currency || 'usd').toUpperCase()}
                    </span>
                  </div>
                )}

                {isBoost && details.boostProject && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project</span>
                    <span className="font-medium">{details.boostProject}</span>
                  </div>
                )}

                {isBoost && details.boostGqi && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GQI Included</span>
                    <span className="font-bold text-primary">{parseInt(details.boostGqi).toLocaleString()} GQI</span>
                  </div>
                )}

                {isBoost && details.boostDuration && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{details.boostDuration} days</span>
                  </div>
                )}

                {!isBoost && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing</span>
                    <span>Monthly</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-xl p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold">
                <CheckCircle2 className="h-4 w-4" />
                {isBoost ? 'Boost activated successfully' : 'Subscription activated successfully'}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={isBoost ? '/dashboard?session_updated=1' : '/discover?session_updated=1'}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
            >
              {isBoost ? 'Go to Dashboard' : 'Explore Directory'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/projects"
              className="flex-1 bg-card border border-border hover:shadow-md text-foreground py-3 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
            >
              Browse Projects
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Receipt Note */}
          <p className="text-xs text-muted-foreground">
            A receipt has been sent to your email. You can manage your subscription from Settings.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
