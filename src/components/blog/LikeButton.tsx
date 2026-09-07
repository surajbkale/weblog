'use client';

import { Heart } from 'lucide-react';
import { postsApi } from '@/lib/api/posts';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
}

export function LikeButton({ postId, initialCount, initialLiked }: LikeButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // FIX #15: SSR renders with initialLiked=false; once auth resolves, fetch real state via React Query
  const { data } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const r = await postsApi.getById(postId);
      return r.data.data;
    },
    enabled: !!user,
  });

  const liked = data ? data.likedByCurrentUser : initialLiked;
  const count = data ? data.likeCount : initialCount;

  const toggleMutation = useMutation({
    mutationFn: async (currentlyLiked: boolean) => {
      if (currentlyLiked) {
        await postsApi.unlike(postId);
      } else {
        await postsApi.like(postId);
      }
    },
    onMutate: async (currentlyLiked) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const previousData = queryClient.getQueryData(['post', postId]);

      // Optimistically update cache
      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) {
          return {
            likedByCurrentUser: !currentlyLiked,
            likeCount: currentlyLiked ? initialCount - 1 : initialCount + 1,
          };
        }
        return {
          ...old,
          likedByCurrentUser: !currentlyLiked,
          likeCount: currentlyLiked ? old.likeCount - 1 : old.likeCount + 1,
        };
      });

      return { previousData };
    },
    onError: (_err, _newLiked, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['post', postId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  const toggle = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (toggleMutation.isPending) return;
    toggleMutation.mutate(liked);
  };

  return (
    <button
      onClick={toggle}
      disabled={toggleMutation.isPending}
      className={cn(
        'flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200',
        liked
          ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700',
        toggleMutation.isPending && 'opacity-70 cursor-not-allowed'
      )}
      aria-label={liked ? 'Unlike post' : 'Like post'}
    >
      <Heart
        className={cn('h-4 w-4 transition-all', liked ? 'fill-current scale-110' : '')}
      />
      <span>{count}</span>
    </button>
  );
}
