'use client';

import { Bookmark } from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';
import { PostListItem } from '@/types/post';
import { cn } from '@/lib/utils/cn';

interface BookmarkButtonProps {
  post: PostListItem;
  className?: string;
}

export function BookmarkButton({ post, className }: BookmarkButtonProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const bookmarked = isBookmarked(post.id);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if wrapped in a Link
    e.stopPropagation();
    
    if (bookmarked) {
      removeBookmark(post.id);
    } else {
      addBookmark(post);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      aria-label={bookmarked ? "Remove from reading list" : "Save to reading list"}
      title={bookmarked ? "Remove from reading list" : "Save to reading list"}
      className={cn(
        "flex items-center justify-center p-2 rounded-full transition-colors",
        bookmarked
          ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
    >
      <Bookmark className={cn("h-5 w-5 transition-transform", bookmarked && "fill-current")} />
    </button>
  );
}
