'use client';

import { useEffect, useRef } from 'react';
import { postsApi } from '@/lib/api/posts';

interface ViewTrackerProps {
  postId: string;
}

export function ViewTracker({ postId }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    
    // Fire the view increment request on the client side silently
    postsApi.incrementView(postId).catch((err) => {
      console.error('Failed to track post view', err);
    });
    
    tracked.current = true;
  }, [postId]);

  return null;
}
