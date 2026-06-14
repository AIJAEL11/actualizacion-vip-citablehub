export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { BarChart3 } from 'lucide-react';
import BoostResults from '@/components/boost-results';

export const metadata: Metadata = {
  title: 'Boost Results — CitableHub',
  description: 'See exactly what your GQI Boost delivered: GQI, impressions, site visits, and lift vs the period before the boost.',
  robots: { index: false, follow: false },
};

export default function BoostResultsPage() {
  return (
    <div className="py-8 max-w-2xl mx-auto space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">Boost Results</h1>
            <p className="text-sm text-muted-foreground">What your money delivered — measured in GQI, with lift vs your pre-boost baseline.</p>
          </div>
        </div>
      </header>

      <BoostResults />

      <p className="text-xs text-muted-foreground">
        GQI (Generative Query Index) is a weighted measure of real reach and engagement. Boost changes how fast and how widely your
        listing is seen — it never changes your organic citability score.
      </p>
    </div>
  );
}
