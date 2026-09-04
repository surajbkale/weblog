'use client';

import { useState } from 'react';
import { PostListItem, PaginatedResponse } from '@/types/post';
import { PostCard } from '@/components/blog/PostCard';
import { postsApi } from '@/lib/api/posts';
import { Loader2, ChevronDown } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface AuthorPostsListProps {
  authorId: string;
  initialData: PaginatedResponse<PostListItem>;
}

export function AuthorPostsList({ authorId, initialData }: AuthorPostsListProps) {
  const [posts, setPosts] = useState<PostListItem[]>(initialData.content);
  const [page, setPage] = useState(initialData.page);
  const [hasMore, setHasMore] = useState(!initialData.last);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await postsApi.list({ authorId, page: nextPage, size: 20 });
      const data = res.data.data;
      
      setPosts(prev => [...prev, ...data.content]);
      setPage(data.page);
      setHasMore(!data.last);
    } catch {
      toast.error('Failed to load more posts');
    } finally {
      setLoading(false);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-600">
        <p>No published posts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      
      {hasMore && (
        <div className="pt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
            {loading ? 'Loading…' : 'Load more stories'}
          </button>
        </div>
      )}
    </div>
  );
}
