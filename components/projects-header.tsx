"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { LogOut, User, LayoutDashboard, Settings, Shield } from 'lucide-react';

export default function ProjectsHeader() {
  const { data: session, status } = useSession() || {};
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isAdmin = (session?.user as any)?.role === 'admin';
  const userDisplay = (session?.user as any)?.displayName || session?.user?.name || session?.user?.email?.split('@')?.[0] || '';

  return (
    <header className="sticky top-0 bg-background/95 border-b border-border z-40 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center h-14">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-200 flex-shrink-0">
            <img src="/logo.png" alt="CitableHub" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tight font-display group-hover:text-primary transition-colors duration-200">
            CitableHub
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <Link href="/projects" className="text-primary font-bold">Projects</Link>

          {!mounted ? (
            <span className="w-16 h-4 bg-muted rounded animate-pulse" />
          ) : status === 'authenticated' && session?.user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 hover:text-foreground transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[11px] font-bold">
                  {userDisplay.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{userDisplay}</span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl py-2 z-50">
                    <Link
                      href="/?page=dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                    </Link>
                    <Link
                      href="/?page=settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Settings className="h-3.5 w-3.5" /> Settings
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/?page=admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Shield className="h-3.5 w-3.5" /> Admin
                      </Link>
                    )}
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => { signOut({ redirect: false }); setMenuOpen(false); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-muted transition w-full cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/auth/signin" className="hover:text-primary transition">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
