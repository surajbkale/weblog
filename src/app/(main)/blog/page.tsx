'use client';

import { Suspense } from 'react';

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { postsApi } from '@/lib/api/posts';
import { categoriesApi } from '@/lib/api/categories';
import { PostListItem, CategoryResponse, PaginatedResponse } from '@/types/post';
import { PostCard, PostCardSkeleton } from '@/components/blog/PostCard';
import { ChevronLeft, ChevronRight, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { SortOption } from '@/lib/api/posts';

const SORT_OPTIONS = [
  { value: 'newest'  as SortOption, label: 'Newest First' },
  { value: 'oldest'  as SortOption, label: 'Oldest First' },
  { value: 'popular' as SortOption, label: 'Most Liked' },
];

/** Narrows a raw URL param string to SortOption, defaulting to 'newest'. */
const VALID_SORTS = SORT_OPTIONS.map((o) => o.value);
function asSort(raw: string | null): SortOption {
  return (VALID_SORTS as string[]).includes(raw ?? '') ? (raw as SortOption) : 'newest';
}

function BlogListingContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const q        = searchParams.get('q')        || '';
  const category = searchParams.get('category') || '';
  const tag      = searchParams.get('tag')      || '';
  const sort     = asSort(searchParams.get('sort'));
  const page     = parseInt(searchParams.get('page') || '0');

  const [data,       setData]       = useState<PaginatedResponse<PostListItem> | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.list();
      return res.data.data;
    },
    retry: 1,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour since categories rarely change
  });
  const [loading,    setLoading]    = useState(true);
  // FIX #8: track fetch errors to show proper UI
  const [fetchError, setFetchError] = useState(false);

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    router.push(`/blog?${params.toString()}`);
  }, [searchParams, router]);

  const clearSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('page');
    router.push(`/blog?${params.toString()}`);
  }, [searchParams, router]);


  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    postsApi
      .list({ q, category, tag, sort, page, size: 12 })
      .then((r) => { setData(r.data.data); })
      .catch(() => { setData(null); setFetchError(true); })
      .finally(() => setLoading(false));
  }, [q, category, tag, sort, page]);

  const hasActiveFilters = q || tag || category;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
          {q ? `Results for "${q}"` : 'Explore'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {q
            ? 'Showing posts matching your search'
            : 'Discover stories and ideas from our community'}
        </p>
      </div>

      {/* Sort + active filter chips row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-blue-400 transition-colors"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Active search chip */}
        {q && (
          <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
            🔍 {q}
            <button
              onClick={clearSearch}
              className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}

        {/* Active tag chip */}
        {tag && (
          <span className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-full text-sm font-medium">
            #{tag}
            <button
              onClick={() => updateParam('tag', '')}
              className="ml-0.5 hover:text-purple-900 dark:hover:text-purple-100 transition-colors"
              aria-label="Clear tag filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={() => router.push('/blog')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline underline-offset-2 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex overflow-x-auto gap-2 pb-1 mb-8 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => updateParam('category', '')}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              !category
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam('category', cat.slug)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                category === cat.slug
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Posts grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : fetchError ? (
        /* FIX #8: show error state with retry */
        <div className="text-center py-24">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Failed to load posts</p>
          <p className="text-gray-500 dark:text-gray-400 mb-5">The server may be unavailable. Please try again.</p>
          <button
            onClick={() => { setFetchError(false); setLoading(true); postsApi.list({ q, category, tag, sort, page, size: 12 }).then(r => setData(r.data.data)).catch(() => setFetchError(true)).finally(() => setLoading(false)); }}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No posts found
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            {q ? `No results for "${q}". Try a different term.` : 'Try adjusting your filters.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => router.push('/blog')}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:no-underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {data.totalElements} post{data.totalElements !== 1 ? 's' : ''} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {data.content.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => updateParam('page', String(page - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
                Page {page + 1} of {data.totalPages}
              </span>
              <button
                onClick={() => updateParam('page', String(page + 1))}
                disabled={data.last}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function BlogListingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <BlogListingContent />
    </Suspense>
  );
}
