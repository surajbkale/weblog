import { Metadata } from 'next';
import axios from 'axios';
import { PostListItem } from '@/types/post';
import { ApiResponse } from '@/types/api';
import { PostCard } from '@/components/blog/PostCard';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Star } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const metadata: Metadata = {
  title: 'Weblogs — Modern Writing Platform',
  description: 'Discover stories, ideas, and expertise from writers on any topic that matters to you.',
};

// Revalidate every 5 minutes
export const revalidate = 300;

async function getTrending(): Promise<PostListItem[]> {
  try {
    const res = await axios.get<ApiResponse<PostListItem[]>>(`${API_BASE}/api/v1/posts/trending`);
    return res.data.data;
  } catch {
    return [];
  }
}

async function getFeatured(): Promise<PostListItem[]> {
  try {
    const res = await axios.get<ApiResponse<PostListItem[]>>(`${API_BASE}/api/v1/posts/featured`);
    return res.data.data;
  } catch {
    return [];
  }
}

async function getLatest(): Promise<PostListItem[]> {
  try {
    const res = await axios.get<ApiResponse<{ content: PostListItem[] }>>(
      `${API_BASE}/api/v1/posts?sort=newest&size=9`
    );
    return res.data.data.content;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [trending, featured, latest] = await Promise.all([
    getTrending(),
    getFeatured(),
    getLatest(),
  ]);

  return (
    <div>
      {/* ── Hero / Featured ─────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">Featured</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Large featured post */}
              {featured[0] && <PostCard post={featured[0]} variant="featured" />}

              {/* Side stack */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {featured.slice(1, 4).map((post) => (
                  <PostCard key={post.id} post={post} variant="compact" />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* ── Latest posts ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest</h2>
              <Link href="/blog" className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {latest.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {latest.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 dark:text-gray-600">
                <p className="text-lg">No posts yet. Be the first to write!</p>
                <Link href="/register" className="mt-3 inline-block text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Get started →
                </Link>
              </div>
            )}
          </div>

          {/* ── Trending sidebar ───────────────────────────────────────────── */}
          {trending.length > 0 && (
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Trending</h2>
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                  {trending.slice(0, 5).map((post, i) => (
                    <div key={post.id} className="flex gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-3xl font-black text-gray-100 dark:text-gray-700 leading-none w-8 text-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">
                          {post.author.displayName}
                        </p>
                        <Link href={`/blog/${post.slug}`} className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {post.title}
                        </Link>
                        <p className="text-xs text-gray-400 mt-1">{post.viewCount.toLocaleString()} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
