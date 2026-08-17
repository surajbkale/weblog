import { Metadata } from 'next';
import axios from 'axios';
import { PostListItem } from '@/types/post';
import { ApiResponse } from '@/types/api';
import { PostCard } from '@/components/blog/PostCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Star } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
// INTERNAL_API_URL is used for SSR fetches that run inside the Docker container.
// In Docker, the frontend container can't reach the API via `localhost` (which
// resolves to the container itself). Set INTERNAL_API_URL=http://host.docker.internal:8080
// in docker-compose so server-side fetches go through the host network.
const SSR_API_BASE = process.env.INTERNAL_API_URL || API_BASE;

export const metadata: Metadata = {
  title: 'Weblogs — Modern Writing Platform',
  description: 'Discover stories, ideas, and expertise from writers on any topic that matters to you.',
};

export const revalidate = 300;

async function getTrending(): Promise<PostListItem[]> {
  try {
    const res = await axios.get<ApiResponse<PostListItem[]>>(`${SSR_API_BASE}/api/v1/posts/trending`);
    return res.data.data;
  } catch {
    return [];
  }
}

async function getFeatured(): Promise<PostListItem[]> {
  try {
    const res = await axios.get<ApiResponse<PostListItem[]>>(`${SSR_API_BASE}/api/v1/posts/featured`);
    return res.data.data;
  } catch {
    return [];
  }
}

async function getLatest(): Promise<PostListItem[]> {
  try {
    const res = await axios.get<ApiResponse<{ content: PostListItem[] }>>(
      `${SSR_API_BASE}/api/v1/posts?sort=newest&size=9`
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />
      <main className="flex-1">

        {/* ── Empty state hero (no posts yet) ─────────────────────────────── */}
        {latest.length === 0 && featured.length === 0 && (
          <section className="flex flex-col items-center justify-center py-32 px-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black mb-6 shadow-xl">
              W
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Welcome to Weblogs
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
              A modern platform for writers and thinkers. Share your stories with the world.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/register"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full text-lg transition-colors shadow-lg shadow-blue-500/30">
                Start Writing
              </Link>
              <Link href="/blog"
                className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-full text-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Explore Posts
              </Link>
            </div>
          </section>
        )}

        {/* ── Featured strip ───────────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                  Featured
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {featured[0] && <PostCard post={featured[0]} variant="featured" />}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {featured.slice(1, 4).map((post) => (
                    <PostCard key={post.id} post={post} variant="compact" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Latest + Trending ────────────────────────────────────────────── */}
        {latest.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Latest posts */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest</h2>
                  <Link href="/blog" className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {latest.map((post) => <PostCard key={post.id} post={post} />)}
                </div>
              </div>

              {/* Trending sidebar */}
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
                            <Link href={`/blog/${post.slug}`}
                              className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
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
        )}

      </main>
      <Footer />
    </div>
  );
}
