export const dynamic = 'force-dynamic';

import ProjectsHeader from '@/components/projects-header';
import SiteFooter from '@/components/site-footer';

/**
 * Shared chrome for SSR content pages. Header + footer are rendered on the
 * server so the page is fully readable by AI crawlers without JavaScript.
 */
export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <ProjectsHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
      <SiteFooter />
    </div>
  );
}
