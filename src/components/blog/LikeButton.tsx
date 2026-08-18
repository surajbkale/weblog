'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { postsApi } from '@/lib/api/posts';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
}

export function LikeButton({ postId, initialCount, initialLiked }: LikeButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // FIX #15: SSR renders with initialLiked=false; once auth resolves, re-fetch the real state
  useEffect(() => {
    if (!user) return;
    postsApi.getById(postId)
      .then(r => {
        setLiked(r.data.data.likedByCurrentUser);
        setCount(r.data.data.likeCount);
      })
      .catch(() => {}); // non-critical — fallback to initial values
  }, [user, postId]);

  const toggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (loading) return;

    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => wasLiked ? c - 1 : c + 1);
    setLoading(true);

    try {
      if (wasLiked) {
        await postsApi.unlike(postId);
      } else {
        await postsApi.like(postId);
      }
    } catch {
      // Revert on error
      setLiked(wasLiked);
      setCount((c) => wasLiked ? c + 1 : c - 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200',
        liked
          ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700',
        loading && 'opacity-70 cursor-not-allowed'
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
