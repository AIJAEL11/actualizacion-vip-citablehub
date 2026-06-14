"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, Sun, Moon, Sparkles, Menu, X, LogIn, LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import LandingView from '@/components/views/landing-view';
import ChatView from '@/components/views/chat-view';
import DiscoverView from '@/components/views/discover-view';
import SubmitView from '@/components/views/submit-view';
import BoostView from '@/components/views/boost-view';
import DashboardView from '@/components/views/dashboard-view';
import AdminView from '@/components/views/admin-view';
// PricingView removed — platform is free, revenue via Boosts only
import SettingsView from '@/components/views/settings-view';
import PromotionView from '@/components/views/promotion-view';
// /privacy, /terms, /contact are now SSR pages under app/(content)/ — linked, not rendered in-SPA.
import FloatingSidebar from '@/components/floating-sidebar';

// Valid SPA routes (legal/contact pages are SSR — see app/(content)/)
const SPA_ROUTES = new Set(['/', '/chat', '/discover', '/submit', '/boost', '/dashboard', '/dashboard/promotion', '/admin', '/settings']);

interface CitableHubAppProps {
  initialProjects: any[];
  initialCategories: any[];
  initialIntents: any[];
}

export function CitableHubApp({
  initialProjects,
  initialCategories,
  initialIntents,
}: CitableHubAppProps) {
  const { data: session, status, update: updateSession } = useSession() || {};
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState<string>('/');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [projects, setProjects] = useState<any[]>(initialProjects ?? []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Resolve initial page from URL path, ?_spa_path= (middleware rewrite), or ?page= param
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const spaPath = params.get('_spa_path');
      const pageParam = params.get('page');
      const sessionUpdated = params.get('session_updated') === '1';

      let resolvedPage = '/';

      if (spaPath && SPA_ROUTES.has(spaPath)) {
        // Middleware rewrite — restore the original URL
        resolvedPage = spaPath;
        window.history.replaceState({ spaPage: spaPath }, '', spaPath + (sessionUpdated ? '' : ''));
      } else if (pageParam) {
        // Legacy deep-link via ?page=
        const pagePath = pageParam.startsWith('/') ? pageParam : `/${pageParam}`;
        if (SPA_ROUTES.has(pagePath)) {
          resolvedPage = pagePath;
          window.history.replaceState({ spaPage: pagePath }, '', pagePath);
        }
      } else if (path !== '/' && SPA_ROUTES.has(path)) {
        resolvedPage = path;
      }

      setCurrentPage(resolvedPage);

      // Force session refresh if coming from checkout
      if (sessionUpdated) {
        updateSession?.();
      }
    }
  }, []);

  // Auth-aware redirect: authenticated users on / go to /dashboard
  useEffect(() => {
    if (status === 'authenticated' && currentPage === '/') {
      setCurrentPage('/dashboard');
      window.history.replaceState({ spaPage: '/dashboard' }, '', '/dashboard');
    }
  }, [status, currentPage]);

  // Listen for browser back/forward
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const path = window.location.pathname;
      if (SPA_ROUTES.has(path)) {
        setCurrentPage(path);
        setPageParams({});
      } else if (path === '/') {
        setCurrentPage('/');
        setPageParams({});
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isAdmin = (session?.user as any)?.role === 'admin';
  const userDisplay = (session?.user as any)?.displayName || session?.user?.name || session?.user?.email?.split('@')?.[0] || '';

  const handleNavigate = useCallback((path: string, params?: Record<string, any>) => {
    setCurrentPage(path);
    setPageParams(params ?? {});
    setIsMobileMenuOpen(false);

    // Update browser URL
    if (SPA_ROUTES.has(path)) {
      window.history.pushState({ spaPage: path }, '', path);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    handleNavigate('/');
  };

  const renderPage = () => {
    switch (currentPage) {
      case '/chat':
        return (
          <ChatView
            onNavigate={handleNavigate}
            projects={projects}
            initialQuery={pageParams?.initialQuery}
          />
        );
      case '/discover':
        return (
          <DiscoverView
            onNavigate={handleNavigate}
            projects={projects}
            categories={initialCategories ?? []}
            intents={initialIntents ?? []}
            selectedCategory={pageParams?.category}
            selectedIntent={pageParams?.intent}
          />
        );
      case '/submit':
        return (
          <SubmitView
            onNavigate={handleNavigate}
            categories={initialCategories ?? []}
            onProjectCreated={(p: any) => setProjects((prev: any[]) => [p, ...(prev ?? [])])}
          />
        );
      case '/boost':
        return (
          <BoostView
            onNavigate={handleNavigate}
            categories={initialCategories ?? []}
          />
        );
      case '/dashboard':
        return (
          <DashboardView
            onNavigate={handleNavigate}
            projects={projects}
          />
        );
      case '/admin':
        return (
          <AdminView onNavigate={handleNavigate} />
        );

      case '/settings':
        return <SettingsView onNavigate={handleNavigate} />;
      case '/dashboard/promotion':
        return <PromotionView onNavigate={handleNavigate} projects={projects} pageParams={pageParams} />;
      default:
        return (
          <LandingView
            onNavigate={handleNavigate}
            projects={projects}
            categories={initialCategories ?? []}
            intents={initialIntents ?? []}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-150 text-foreground flex flex-col justify-between font-sans">
      {/* Floating Sidebar — only on homepage */}
      {currentPage === '/' && (
        <FloatingSidebar projects={projects} onNavigate={handleNavigate} />
      )}
      {/* HEADER */}
      <header className="sticky top-0 bg-background/95 border-b border-border z-40 select-none backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center h-14">
          {/* Logo */}
          <div
            onClick={() => handleNavigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-200 flex-shrink-0">
              <img src="/logo.png" alt="CitableHub" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight font-display group-hover:text-primary transition-colors duration-200">
              CitableHub
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold text-muted-foreground">
            <button onClick={() => handleNavigate('/chat')} className={`hover:text-primary transition cursor-pointer ${currentPage === '/chat' ? 'text-primary' : ''}`}>Ask Discovery AI</button>
            <a href="/projects" className="hover:text-primary transition cursor-pointer">Projects</a>
            {session && (
              <button onClick={() => handleNavigate('/discover')} className={`hover:text-primary transition cursor-pointer ${currentPage === '/discover' ? 'text-primary' : ''}`}>Registry</button>
            )}
            <button onClick={() => handleNavigate('/submit')} className={`bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1 rounded-full transition cursor-pointer flex items-center gap-1 font-bold ${currentPage === '/submit' ? 'ring-2 ring-primary/30' : ''}`}>List Project Free</button>
            {session && (
              <button onClick={() => handleNavigate('/boost')} className={`text-primary hover:text-primary/80 transition cursor-pointer font-bold bg-primary/5 px-2.5 py-1 rounded-full border border-primary/20 ${currentPage === '/boost' ? 'ring-2 ring-primary/30' : ''}`}>GQI Boost</button>
            )}

            {session && (
              <button onClick={() => handleNavigate('/dashboard')} className={`hover:text-foreground transition cursor-pointer ${currentPage === '/dashboard' ? 'text-primary font-bold' : ''}`}>Dashboard</button>
            )}
            {isAdmin && (
              <button onClick={() => handleNavigate('/admin')} className="text-primary hover:text-primary/80 border border-primary/20 px-2.5 py-1 rounded-lg transition cursor-pointer bg-background shadow-sm">Admin</button>
            )}
          </nav>

          {/* Utility Controls */}
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-muted transition border border-transparent hover:border-border text-muted-foreground hover:text-primary cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            {session ? (
              <>
                <button
                  onClick={() => handleNavigate('/settings')}
                  className={`p-2 rounded-lg hover:bg-muted text-xs font-semibold hover:text-primary flex items-center gap-1 border border-border cursor-pointer ${currentPage === '/settings' ? 'bg-muted text-primary' : ''}`}
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span className="hidden sm:inline lowercase text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold">{userDisplay}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 cursor-pointer transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/auth/signin')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer transition"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border p-4 space-y-3 shadow-md text-xs z-40">
          <button onClick={() => handleNavigate('/chat')} className="w-full text-left py-2 font-bold hover:text-primary block cursor-pointer">Ask Discovery AI</button>
          <a href="/projects" className="w-full text-left py-2 font-bold hover:text-primary block cursor-pointer">Projects</a>
          {session && (
            <button onClick={() => handleNavigate('/discover')} className="w-full text-left py-2 font-bold hover:text-primary block cursor-pointer">Registry</button>
          )}
          {session && (
            <button onClick={() => handleNavigate('/boost')} className="w-full text-left py-2 font-bold hover:text-primary block cursor-pointer">GQI Boost</button>
          )}
          <button onClick={() => handleNavigate('/submit')} className="w-full text-left py-2 font-bold text-primary block cursor-pointer">List Project Free</button>

          {session && (
            <button onClick={() => handleNavigate('/dashboard')} className="w-full text-left py-2 font-bold block cursor-pointer">Dashboard</button>
          )}
          {isAdmin && (
            <button onClick={() => handleNavigate('/admin')} className="w-full text-left py-2 font-bold text-primary block cursor-pointer">Admin</button>
          )}
          {session ? (
            <button onClick={handleSignOut} className="w-full text-left py-2 font-bold text-destructive block cursor-pointer">Sign out</button>
          ) : (
            <button onClick={() => { setIsMobileMenuOpen(false); router.push('/auth/signin'); }} className="w-full text-left py-2 font-bold text-primary block cursor-pointer">Sign in</button>
          )}
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className={currentPage === '/chat' ? 'flex-1 w-full flex flex-col min-h-0' : 'flex-1 max-w-7xl w-full mx-auto px-4 py-6'}>
        {renderPage()}
      </main>

      {/* FOOTER */}
      {currentPage !== '/chat' && (
        <footer className="bg-background border-t border-border p-6 sm:p-8 text-[11px] leading-relaxed text-muted-foreground">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-border/50 pb-6">
              <div className="space-y-2">
                <div className="font-bold text-foreground uppercase tracking-wider text-[10px] font-mono">
                  Directory ({(projects ?? []).length})
                </div>
                <ul className="space-y-1">
                  {(projects ?? []).slice(0, 6).map((p: any) => (
                    <li key={p?.id}>
                      <button
                        onClick={() => handleNavigate(`/p/${p?.slug}`)}
                        className="text-primary hover:underline transition cursor-pointer text-left"
                      >
                        {p?.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-foreground uppercase tracking-wider text-[10px] font-mono">
                  Categories
                </div>
                <ul className="space-y-1">
                  {(initialCategories ?? []).slice(0, 6).map((c: any) => (
                    <li key={c?.id}>
                      <button
                        onClick={() => handleNavigate('/discover', { category: c?.id })}
                        className="text-primary hover:underline transition cursor-pointer text-left"
                      >
                        {c?.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="CitableHub" className="w-8 h-8 rounded-lg" />
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground text-xs font-display">CitableHub</div>
                  <p className="max-w-md">
                    The Truth Engine for AI Search
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <a href="/about" className="text-muted-foreground hover:text-primary transition cursor-pointer">About</a>
                <span className="text-border">·</span>
                <a href="/privacy" className="text-muted-foreground hover:text-primary transition cursor-pointer">Privacy</a>
                <span className="text-border">·</span>
                <a href="/terms" className="text-muted-foreground hover:text-primary transition cursor-pointer">Terms</a>
                <span className="text-border">·</span>
                <a href="/contact" className="text-muted-foreground hover:text-primary transition cursor-pointer">Contact</a>
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
      )}
    </div>
  );
}
