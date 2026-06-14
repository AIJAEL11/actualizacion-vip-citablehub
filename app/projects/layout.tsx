export const dynamic = "force-dynamic";

import Link from 'next/link';
import ProjectsHeader from '@/components/projects-header';

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <ProjectsHeader />

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="CitableHub" className="w-6 h-6 rounded-md" />
            <span>© 2026 CitableHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-primary transition">Home</Link>
            <Link href="/projects" className="hover:text-primary transition">Directory</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
