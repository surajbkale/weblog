'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '@/lib/api/posts';
import { PostListItem } from '@/types/post';
import { Navbar } from '@/components/layout/Navbar';
import { formatDistanceToNow } from 'date-fns';
import { PenSquare, Eye, EyeOff, Trash2, Edit2, Clock, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  DRAFT:     'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  DELETED:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

export default function MyPostsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    postsApi.myPosts(0, 50)
      .then((r) => setPosts(r.data.data.content))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handlePublish = async (id: string) => {
    setActionId(id);
    try {
      const res = await postsApi.publish(id);
      setPosts((p) => p.map((post) => post.id === id ? { ...post, status: res.data.data.status as any, publishedAt: res.data.data.publishedAt } : post));
    } catch { alert('Failed to publish.'); }
    finally { setActionId(null); }
  };

  const handleUnpublish = async (id: string) => {
    setActionId(id);
    try {
      const res = await postsApi.unpublish(id);
      setPosts((p) => p.map((post) => post.id === id ? { ...post, status: res.data.data.status as any } : post));
    } catch { alert('Failed to unpublish.'); }
    finally { setActionId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Move this post to trash?')) return;
    setActionId(id);
    try {
      await postsApi.delete(id);
      setPosts((p) => p.map((post) => post.id === id ? { ...post, status: 'DELETED' as any } : post));
    } catch { alert('Failed to delete.'); }
    finally { setActionId(null); }
  };

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
          <Link href="/dashboard/posts/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full text-sm transition-colors shadow-sm">
            <PenSquare className="h-4 w-4" /> New Post
          </Link>
        </div>

        {/* Posts table */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map((i) => (
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
            <Link href="/dashboard/posts/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full text-sm transition-colors">
              <PenSquare className="h-4 w-4" /> Write your first post
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id}
                className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">

                {/* Cover thumbnail */}
                {post.coverImageUrl ? (
                  <img src={post.coverImageUrl} alt={post.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 hidden sm:block" />
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
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link href={`/dashboard/posts/${post.slug}/edit`}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    title="Edit">
                    <Edit2 className="h-4 w-4" />
                  </Link>

                  {post.status === 'DRAFT' && (
                    <button onClick={() => handlePublish(post.id)} disabled={actionId === post.id}
                      className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                      title="Publish">
                      <Eye className="h-4 w-4" />
                    </button>
                  )}

                  {post.status === 'PUBLISHED' && (
                    <button onClick={() => handleUnpublish(post.id)} disabled={actionId === post.id}
                      className="p-2 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors disabled:opacity-50"
                      title="Unpublish">
                      <EyeOff className="h-4 w-4" />
                    </button>
                  )}

                  {post.status !== 'DELETED' && (
                    <button onClick={() => handleDelete(post.id)} disabled={actionId === post.id}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                      title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
