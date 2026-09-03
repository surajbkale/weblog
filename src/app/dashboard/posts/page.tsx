'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { formatDistanceToNow } from 'date-fns';
import { PenSquare, Clock, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useMyPosts } from '@/hooks/useMyPosts';
import { PostActions } from '@/components/blog/PostActions';

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  DRAFT:     'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  DELETED:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

export default function MyPostsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect guests
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  // All post-management state and mutations live in the shared hook.
  // pageSize=50 loads everything at once — no "load more" needed here.
  const {
    posts,
    loading,
    actionId,
    handlePublish,
    handleUnpublish,
    handleDelete,
  } = useMyPosts({ pageSize: 50 });

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-1">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">My Posts</h1>
          </div>
          <Link
            href="/dashboard/posts/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full text-sm transition-colors shadow-sm"
          >
            <PenSquare className="h-4 w-4" /> New Post
          </Link>
        </div>

        {/* Posts list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
            <p className="text-5xl mb-4">✍️</p>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No posts yet</p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Start writing your first article</p>
            <Link
              href="/dashboard/posts/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full text-sm transition-colors"
            >
              <PenSquare className="h-4 w-4" /> Write your first post
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                {/* Cover thumbnail */}
                {post.coverImageUrl ? (
                  <Image
                    src={post.coverImageUrl}
                    alt={post.title}
                    width={64}
                    height={64}
                    className="rounded-lg object-cover flex-shrink-0 hidden sm:block"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 hidden sm:flex items-center justify-center flex-shrink-0">
                    <PenSquare className="h-6 w-6 text-gray-400" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[post.status])}>
                      {post.status}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" /> {post.readingTimeMinutes} min
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{post.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {post.publishedAt
                      ? `Published ${formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}`
                      : `Created ${formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}`}
                    {' · '}{post.viewCount} views · {post.likeCount} likes
                  </p>
                </div>

                {/* Actions */}
                <PostActions
                  post={post}
                  actionId={actionId}
                  editHref={`/dashboard/posts/${post.slug}/edit`}
                  size="md"
                  onPublish={handlePublish}
                  onUnpublish={handleUnpublish}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
