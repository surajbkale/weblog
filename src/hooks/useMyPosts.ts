'use client';

import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const [actionId, setActionId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['myPosts', pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const r = await postsApi.myPosts(pageParam, pageSize);
      return r.data.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return !lastPage.last ? lastPage.page + 1 : undefined;
    },
  });

  const posts = data ? data.pages.flatMap((page) => page.content) : [];

  const publishMutation = useMutation({
    mutationFn: (id: string) => postsApi.publish(id),
    onMutate: (id) => setActionId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      toast.success('Post published!');
    },
    onError: () => toast.error('Failed to publish. Please try again.'),
    onSettled: () => setActionId(null),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => postsApi.unpublish(id),
    onMutate: (id) => setActionId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      toast.info('Post unpublished and saved as draft.');
    },
    onError: () => toast.error('Failed to unpublish. Please try again.'),
    onSettled: () => setActionId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onMutate: (id) => setActionId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      toast.success('Post moved to trash.');
    },
    onError: () => toast.error('Failed to delete. Please try again.'),
    onSettled: () => setActionId(null),
  });

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      message: 'Move this post to trash?',
      confirmLabel: 'Move to trash',
      destructive: true,
    });
    if (ok) deleteMutation.mutate(id);
  };

  return {
    posts,
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    actionId,
    loadMore: fetchNextPage,
    handlePublish: (id: string) => publishMutation.mutate(id),
    handleUnpublish: (id: string) => unpublishMutation.mutate(id),
    handleDelete,
  };
}
