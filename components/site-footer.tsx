import Link from 'next/link';

/**
 * Server-rendered footer for SSR content pages (/about, /privacy, /terms,
 * /contact, /best, /compare). Uses real <Link> anchors so crawlers can follow
 * internal links — important for AI discoverability and GEO crawl depth.
 */
export default function SiteFooter() {
  return (
    <footer className="bg-background border-t border-border p-6 sm:p-8 text-[11px] leading-relaxed text-muted-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-border/50 pb-6">
          <div className="space-y-2">
            <div className="font-bold text-foreground uppercase tracking-wider text-[10px] font-mono">Platform</div>
            <ul className="space-y-1">
              <li><Link href="/" className="hover:text-primary transition">Home</Link></li>
              <li><Link href="/projects" className="hover:text-primary transition">Projects Directory</Link></li>
              <li><Link href="/submit" className="hover:text-primary transition">List Project Free</Link></li>
              <li><Link href="/scan" className="hover:text-primary transition">Free GEO Scan</Link></li>
              <li><Link href="/chat" className="hover:text-primary transition">Ask Discovery AI</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-foreground uppercase tracking-wider text-[10px] font-mono">Discover</div>
            <ul className="space-y-1">
              <li><Link href="/best/developer-tools" className="hover:text-primary transition">Best Developer Tools</Link></li>
              <li><Link href="/best/productivity" className="hover:text-primary transition">Best Productivity Tools</Link></li>
              <li><Link href="/best/marketing-sales" className="hover:text-primary transition">Best Marketing Tools</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-foreground uppercase tracking-wider text-[10px] font-mono">Company</div>
            <ul className="space-y-1">
              <li><Link href="/about" className="hover:text-primary transition">About CitableHub</Link></li>
              <li><Link href="/mcp" className="hover:text-primary transition">MCP Gateway</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition">Contact</Link></li>
              <li><a href="https://wildverse.io" rel="noopener" className="hover:text-primary transition">Wildverse LLC</a></li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-foreground uppercase tracking-wider text-[10px] font-mono">Legal &amp; AI</div>
            <ul className="space-y-1">
              <li><Link href="/privacy" className="hover:text-primary transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition">Terms of Service</Link></li>
              <li><a href="/llms.txt" className="hover:text-primary transition">llms.txt</a></li>
              <li><a href="/.well-known/ai-plugin.json" className="hover:text-primary transition">AI Plugin Manifest</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="CitableHub" className="w-8 h-8 rounded-lg" />
            <div className="space-y-0.5">
              <div className="font-bold text-foreground text-xs font-display">CitableHub</div>
              <p className="max-w-md">The Truth Engine for AI Search</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[9px] uppercase font-black tracking-widest text-primary">GEO COMPLIANT</span>
            <span className="text-[9px] text-muted-foreground/80">© 2026 CitableHub</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
