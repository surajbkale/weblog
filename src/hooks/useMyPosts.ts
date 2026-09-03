'use client';

import { useState, useEffect, useCallback } from 'react';
import { postsApi } from '@/lib/api/posts';
import { PostListItem } from '@/types/post';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';

interface UseMyPostsOptions {
  /** How many posts to fetch per page (default 20). */
  pageSize?: number;
}

/**
 * Shared hook that owns all post-management state and mutations.
 * Used by both /dashboard/posts and /profile (StoriesTab) so any
 * bug fix or behaviour change is applied in one place.
 */
export function useMyPosts({ pageSize = 20 }: UseMyPostsOptions = {}) {
  const toast   = useToast();
  const confirm = useConfirm();

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(
    async (p: number, append: boolean) => {
      try {
        const r = await postsApi.myPosts(p, pageSize);
        const data = r.data.data;
        setPosts((prev) => (append ? [...prev, ...data.content] : data.content));
        setHasMore(!data.last);
        setPage(p);
      } catch {
        /* non-critical — silently ignore */
      }
    },
    [pageSize],
  );

  useEffect(() => {
    setLoading(true);
    fetchPosts(0, false).finally(() => setLoading(false));
  }, [fetchPosts]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchPosts(page + 1, true);
    setLoadingMore(false);
  };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const handlePublish = async (id: string) => {
    setActionId(id);
    try {
      const res = await postsApi.publish(id);
      const { status, publishedAt } = res.data.data;
      setPosts((p) => p.map((post) => (post.id === id ? { ...post, status, publishedAt } : post)));
      toast.success('Post published!');
    } catch {
      toast.error('Failed to publish. Please try again.');
    } finally {
      setActionId(null);
    }
  };

  const handleUnpublish = async (id: string) => {
    setActionId(id);
    try {
      const res = await postsApi.unpublish(id);
      const { status } = res.data.data;
      setPosts((p) => p.map((post) => (post.id === id ? { ...post, status } : post)));
      toast.info('Post unpublished and saved as draft.');
    } catch {
      toast.error('Failed to unpublish. Please try again.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      message: 'Move this post to trash?',
      confirmLabel: 'Move to trash',
      destructive: true,
    });
    if (!ok) return;
    setActionId(id);
    try {
      await postsApi.delete(id);
      setPosts((p) =>
        p.map((post) => (post.id === id ? { ...post, status: 'DELETED' as const } : post)),
      );
      toast.success('Post moved to trash.');
    } catch {
      toast.error('Failed to delete. Please try again.');
    } finally {
      setActionId(null);
    }
  };

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    actionId,
    loadMore,
    handlePublish,
    handleUnpublish,
    handleDelete,
  };
}
