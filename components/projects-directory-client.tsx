"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Search, Shield, TrendingUp, Star, ChevronLeft, ChevronRight, Globe,
  Eye, Sparkles, Award, CheckCircle, Zap, ArrowUpRight, Loader2,
  LayoutGrid, ChevronsLeft, ChevronsRight, Crown, ClipboardCheck,
  Bookmark, ArrowUp, ArrowDown, Flame
} from 'lucide-react';
import { scoreColor, scoreBand } from '@/lib/programmatic-pages';

interface Props {
  projects: any[];
  categories: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sort: string;
  category: string;
  search: string;
  siteUrl: string;
}

function MovementBadge({ rankPosition, prevRankPosition }: { rankPosition: number; prevRankPosition: number }) {
  if (!rankPosition || !prevRankPosition || prevRankPosition === 0) return null;
  const diff = prevRankPosition - rankPosition; // positive = moved up
  if (diff === 0) return null;
  if (diff >= 5) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
        <Flame className="h-2.5 w-2.5" /> +{diff}
      </span>
    );
  }
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
        <ArrowUp className="h-2.5 w-2.5" /> +{diff}
      </span>
    );
  }
  if (diff < -3) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400">
        <ArrowDown className="h-2.5 w-2.5" /> {diff}
      </span>
    );
  }
  return null;
}

function StatusBadge({ status, boostScore, platformPartner }: { status: string; boostScore?: number; platformPartner?: boolean }) {
  if (platformPartner) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-700">
        <Crown className="h-2.5 w-2.5" /> Launch Partner
      </span>
    );
  }
  if (boostScore && boostScore > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400" title="Paid promotion — does not affect the organic GEO score">
        <Zap className="h-2.5 w-2.5" /> Promoted
      </span>
    );
  }
  const config: Record<string, { bg: string; text: string; label: string; Icon: any }> = {
    invited: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Invited', Icon: Sparkles },
    registered: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Registered', Icon: Award },
    verified: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Verified', Icon: CheckCircle },
  };
  const c = config[status];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
      <c.Icon className="h-2.5 w-2.5" /> {c.label}
    </span>
  );
}

// Analytics helper
function trackEvent(type: string, metadata?: Record<string, any>) {
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, metadata }),
  }).catch(() => {});
}

export default function ProjectsDirectoryClient({
  projects: initialProjects,
  categories,
  total,
  page,
  pageSize: initialPageSize,
  totalPages,
  sort: initialSort,
  category: initialCategory,
  search: initialSearch,
  siteUrl,
}: Props) {
  const router = useRouter();
  const [displayedProjects, setDisplayedProjects] = useState(initialProjects);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentLoadedPage, setCurrentLoadedPage] = useState(page);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [activeSort, setActiveSort] = useState(initialSort);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activePageSize, setActivePageSize] = useState(initialPageSize);
  const newItemsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Track page view
  useEffect(() => {
    trackEvent('pagination_view', { page, page_size: initialPageSize, total });
  }, [page, initialPageSize, total]);

  // Track impressions for visible projects
  useEffect(() => {
    (initialProjects ?? []).forEach((p: any) => {
      trackEvent('project_impression', { project_id: p.id, position: p.position_index, page });
    });
  }, [initialProjects, page]);

  // Reset displayed projects when SSR data changes
  useEffect(() => {
    setDisplayedProjects(initialProjects);
    setCurrentLoadedPage(page);
  }, [initialProjects, page]);

  // Navigate with params
  const navigate = useCallback((params: Record<string, string>) => {
    const sp = new URLSearchParams();
    const p = { page: '1', sort: activeSort, category: activeCategory, page_size: String(activePageSize), search: searchInput, ...params };
    if (p.page !== '1') sp.set('page', p.page);
    if (p.sort !== 'rank') sp.set('sort', p.sort);
    if (p.category) sp.set('category', p.category);
    if (p.page_size !== '12') sp.set('page_size', p.page_size);
    if (p.search) sp.set('search', p.search);
    const qs = sp.toString();
    router.push(`/projects${qs ? `?${qs}` : ''}`);
  }, [router, activeSort, activeCategory, activePageSize, searchInput]);

  // Load More (append next page client-side)
  const handleLoadMore = async () => {
    if (loadingMore || currentLoadedPage >= totalPages) return;
    setLoadingMore(true);
    const nextPage = currentLoadedPage + 1;
    trackEvent('load_more_click', { from_page: currentLoadedPage, next_page: nextPage });

    try {
      const sp = new URLSearchParams();
      sp.set('page', String(nextPage));
      sp.set('page_size', String(activePageSize));
      if (activeSort !== 'rank') sp.set('sort', activeSort);
      if (activeCategory) sp.set('category', activeCategory);
      if (searchInput) sp.set('search', searchInput);

      const res = await fetch(`/api/projects?${sp.toString()}`);
      const data = await res.json();
      if (data?.projects?.length) {
        setDisplayedProjects((prev) => [...prev, ...data.projects]);
        setCurrentLoadedPage(nextPage);
        // Track new impressions
        data.projects.forEach((p: any) => {
          trackEvent('project_impression', { project_id: p.id, position: p.position_index, page: nextPage });
        });
        // Smooth scroll to new items
        setTimeout(() => {
          newItemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    } catch (e) {
      console.warn('Load more error:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      navigate({ search: value, page: '1' });
    }, 400);
  };

  const handleProjectClick = (project: any) => {
    trackEvent('project_click', { project_id: project.id, position: project.position_index, page });
  };

  const startItem = (page - 1) * activePageSize + 1;
  const endItem = Math.min(page * activePageSize, total);
  // For load more, show extended range
  const displayEndItem = Math.min(startItem + displayedProjects.length - 1, total);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight font-display flex items-center gap-2">
            <Globe className="h-7 w-7 text-primary" />
            Project Directory
          </h1>
          <p className="text-muted-foreground text-sm">
            Browse {total} citable software projects, each scored 0-100 for AI citability. Promoted listings are labeled.
          </p>
        </motion.div>

        {/* Filters Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            {/* Sort buttons */}
            <div className="flex gap-1">
              {([
                { id: 'rank', label: 'Rank', icon: TrendingUp },
                { id: 'trust', label: 'Trust', icon: Shield },
                { id: 'recent', label: 'Recent', icon: Star },
              ] as const).map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSort(s.id); navigate({ sort: s.id, page: '1' }); }}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    activeSort === s.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30'
                  }`}
                >
                  <s.icon className="h-3 w-3" />
                  {s.label}
                </button>
              ))}
            </div>

            {/* Page size selector */}
            <div className="flex items-center gap-1">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <select
                value={activePageSize}
                onChange={(e) => {
                  const ps = parseInt(e.target.value, 10);
                  setActivePageSize(ps);
                  navigate({ page_size: String(ps), page: '1' });
                }}
                className="bg-card border border-border rounded-lg px-2 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                <option value={12}>12 / page</option>
                <option value={24}>24 / page</option>
                <option value={48}>48 / page</option>
              </select>
            </div>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setActiveCategory(''); navigate({ category: '', page: '1' }); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                !activeCategory ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30'
              }`}
            >
              All
            </button>
            {(categories ?? []).map((c: any) => (
              <button
                key={c.id}
                onClick={() => { setActiveCategory(c.id); navigate({ category: c.id, page: '1' }); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                  activeCategory === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30'
                }`}
              >
                {c.name} {c.count > 0 && <span className="opacity-60">({c.count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Results info + Top Pagination */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing <strong className="text-foreground">{startItem}–{displayEndItem}</strong> of <strong className="text-foreground">{total}</strong> projects
          </p>
          {totalPages > 1 && (
            <PaginationNav page={page} totalPages={totalPages} activeSort={activeSort} activeCategory={activeCategory} activePageSize={activePageSize} searchInput={searchInput} />
          )}
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(displayedProjects ?? []).map((p: any, i: number) => {
            const isNewBatch = i >= initialProjects.length;
            return (
              <motion.div
                key={p.id}
                ref={i === initialProjects.length ? newItemsRef : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
              >
                <Link
                  href={`/p/${p.slug}`}
                  onClick={() => handleProjectClick(p)}
                  className="block bg-card border border-border rounded-xl p-5 space-y-3 shadow-sm hover:shadow-md transition group"
                >
                  <div className="flex items-center gap-3">
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-lg text-white" style={{ backgroundColor: ['#6D28D9','#2563EB','#059669','#D97706','#DC2626','#7C3AED','#0891B2'][(p.name||'').split('').reduce((a: number,c: string)=>a+c.charCodeAt(0),0)%7] }}>
                        {(p.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold font-display truncate group-hover:text-primary transition">{p.name}</h3>
                        <StatusBadge status={p.status} boostScore={p.boostScore} platformPartner={p.platformPartner} />
                        <MovementBadge rankPosition={p.rankPosition} prevRankPosition={p.prevRankPosition} />
                      </div>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">{p.category}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">#{p.position_index}</span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{p.summary}</p>

                  {/* Single GEO Score bar — fixed 0-100 scale, labeled */}
                  {(() => {
                    const geo = Math.round(p.geo_score ?? p.rank_score ?? 0);
                    return (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 flex-shrink-0" style={{ color: scoreColor(geo) }} />
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${geo}%`, backgroundColor: scoreColor(geo) }} />
                        </div>
                        <span className="text-[10px] font-mono font-bold" style={{ color: scoreColor(geo) }}>{geo}</span>
                        <span className="text-[9px] font-mono uppercase tracking-wide text-muted-foreground">GEO</span>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <div className="flex items-center gap-3">
                      {(p.impressions ?? 0) > 0 && (
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.impressions}</span>
                      )}
                      {(p.clicks ?? 0) > 0 && (
                        <span>{p.clicks} clicks</span>
                      )}
                      {(p.savesCount ?? 0) > 0 && (
                        <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" /> {p.savesCount}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold" style={{ color: scoreColor(Math.round(p.geo_score ?? p.rank_score ?? 0)) }}>Score: {Math.round(p.geo_score ?? p.rank_score ?? 0)}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {displayedProjects.length === 0 && (
          <div className="text-center py-16 text-muted-foreground space-y-3">
            <p className="text-lg font-bold">No projects found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Load More button */}
        {currentLoadedPage < totalPages && (
          <div className="flex justify-center py-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-6 py-3 rounded-xl font-bold text-sm transition cursor-pointer disabled:opacity-50"
            >
              {loadingMore ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
              ) : (
                <>Load More Projects</>  
              )}
            </button>
          </div>
        )}

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </p>
            <PaginationNav page={page} totalPages={totalPages} activeSort={activeSort} activeCategory={activeCategory} activePageSize={activePageSize} searchInput={searchInput} />
          </div>
        )}
      </div>
    </div>
  );
}

// Pagination nav component with accessible links
function PaginationNav({
  page,
  totalPages,
  activeSort,
  activeCategory,
  activePageSize,
  searchInput,
}: {
  page: number;
  totalPages: number;
  activeSort: string;
  activeCategory: string;
  activePageSize: number;
  searchInput: string;
}) {
  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (p > 1) sp.set('page', String(p));
    if (activeSort !== 'rank') sp.set('sort', activeSort);
    if (activeCategory) sp.set('category', activeCategory);
    if (activePageSize !== 12) sp.set('page_size', String(activePageSize));
    if (searchInput) sp.set('search', searchInput);
    const qs = sp.toString();
    return `/projects${qs ? `?${qs}` : ''}`;
  };

  // Generate page numbers to show
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {/* First */}
      {page > 2 && (
        <Link
          href={buildHref(1)}
          aria-label="First page"
          className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Link>
      )}

      {/* Prev */}
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          rel="prev"
          aria-label="Previous page"
          className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="p-2 text-muted-foreground/30"><ChevronLeft className="h-4 w-4" /></span>
      )}

      {/* Page numbers */}
      {pages.map((p, i) => {
        if (p === '...') {
          return <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">…</span>;
        }
        const isCurrent = p === page;
        return (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={isCurrent ? 'page' : undefined}
            aria-label={`Page ${p}`}
            className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg text-sm font-bold transition ${
              isCurrent
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {p}
          </Link>
        );
      })}

      {/* Next */}
      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          rel="next"
          aria-label="Next page"
          className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="p-2 text-muted-foreground/30"><ChevronRight className="h-4 w-4" /></span>
      )}

      {/* Last */}
      {page < totalPages - 1 && (
        <Link
          href={buildHref(totalPages)}
          aria-label="Last page"
          className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
        >
          <ChevronsRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}