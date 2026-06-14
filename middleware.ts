import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// SPA routes that should be served by the root page.
// /privacy, /terms, and /contact are now real SSR pages (app/(content)/*) so
// crawlers can read them without JavaScript — they are intentionally excluded.
const SPA_ROUTES = new Set(['/chat', '/discover', '/boost', '/dashboard', '/dashboard/promotion', '/submit', '/settings', '/admin']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If it's a SPA route, rewrite to / so the SPA shell handles it
  if (SPA_ROUTES.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    // Preserve the original path as a query param for the SPA to read
    url.searchParams.set('_spa_path', pathname);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/chat', '/discover', '/boost', '/dashboard', '/dashboard/promotion', '/submit', '/settings', '/admin'],
};
