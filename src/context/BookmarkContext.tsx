'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PostListItem } from '@/types/post';

interface BookmarkContextType {
  bookmarks: PostListItem[];
  addBookmark: (post: PostListItem) => void;
  removeBookmark: (postId: string) => void;
  isBookmarked: (postId: string) => boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

const STORAGE_KEY = 'weblogs_bookmarks';

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<PostListItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage on mount to avoid SSR hydration mismatches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse bookmarks from localStorage', e);
    }
    setIsMounted(true);
  }, []);

  // Sync to localStorage whenever bookmarks state changes, but only after mount
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.error('Failed to save bookmarks to localStorage', e);
    }
  }, [bookmarks, isMounted]);

  const addBookmark = useCallback((post: PostListItem) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === post.id)) return prev;
      return [post, ...prev];
    });
  }, []);

  const removeBookmark = useCallback((postId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== postId));
  }, []);

  const isBookmarked = useCallback(
    (postId: string) => bookmarks.some((b) => b.id === postId),
    [bookmarks]
  );

  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}
