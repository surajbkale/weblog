'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { postsApi } from '@/lib/api/posts';
import { categoriesApi } from '@/lib/api/categories';
import { PostListItem, CategoryResponse, PaginatedResponse } from '@/types/post';
import { PostCard, PostCardSkeleton } from '@/components/blog/PostCard';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Most Viewed' },
];

export default function BlogListingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q        = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const tag      = searchParams.get('tag') || '';
  const sort     = searchParams.get('sort') || 'newest';
  const page     = parseInt(searchParams.get('page') || '0');

  const [data, setData] = useState<PaginatedResponse<PostListItem> | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page'); // reset page on filter change
    router.push(`/blog?${params.toString()}`);
  };

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    postsApi.list({ q, category, tag, sort: sort as any, page, size: 12 })
      .then((r) => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [q, category, tag, sort, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Explore</h1>
        <p className="text-gray-500 dark:text-gray-400">Discover stories and ideas from our community</p>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-8 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-xl px-3 py-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts…"
            className="bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none w-full"
          />
        </form>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="text-sm bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-none rounded-xl px-3 py-2 outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => updateParam('category', '')}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              !category
                ? 'bg-blue-600 text-white'
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
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                category === cat.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Active filters */}
      {(q || tag) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {q && (
            <span className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
              Search: "{q}"
              <button onClick={() => { setSearchInput(''); updateParam('q', ''); }} className="hover:text-blue-900 dark:hover:text-blue-100">✕</button>
            </span>
          )}
          {tag && (
            <span className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm">
              Tag: {tag}
              <button onClick={() => updateParam('tag', '')} className="hover:text-purple-900">✕</button>
            </span>
          )}
        </div>
      )}

      {/* Posts grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No posts found</p>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search term</p>
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
