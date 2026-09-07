'use client';

import Link from 'next/link';
import { Edit2, Eye, EyeOff, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { PostListItem } from '@/types/post';

interface PostActionsProps {
  post: PostListItem;
  /** The post currently being mutated (shows spinner / disabled state). */
  actionId: string | null;
  /** Full href for the edit page, e.g. /profile/posts/{slug}/edit */
  editHref: string;
  /** Show an "open in new tab" link for published posts (profile view). */
  showViewLink?: boolean;
  /** Replace icons with a spinner while the action is in-flight (profile view). */
  showSpinner?: boolean;
  /** Button padding variant: 'sm' for profile list, 'md' for dashboard cards. */
  size?: 'sm' | 'md';
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Shared action-button strip for post management rows.
 * Renders: [view-live?] [edit] [publish | unpublish] [delete]
 *
 * Used in both /dashboard/posts and /profile (StoriesTab).
 */
export function PostActions({
  post,
  actionId,
  editHref,
  showViewLink = false,
  showSpinner = false,
  size = 'md',
  onPublish,
  onUnpublish,
  onDelete,
}: PostActionsProps) {
  const busy = actionId === post.id;
  const pad  = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <span className="flex items-center gap-1">

      {/* ── View live (published posts, profile only) ─────────────────── */}
      {showViewLink && post.status === 'PUBLISHED' && (
        <Link
          href={`/blog/${post.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${pad} rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
          title="View live"
          aria-label="View published post in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      )}

      {/* ── Edit ─────────────────────────────────────────────────────── */}
      <Link
        href={editHref}
        className={`${pad} rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
        title="Edit"
        aria-label="Edit post"
      >
        <Edit2 className="h-4 w-4" />
      </Link>

      {/* ── Publish (draft → published) ───────────────────────────────── */}
      {post.status === 'DRAFT' && (
        <button
          onClick={() => onPublish(post.id)}
          disabled={busy}
          className={`${pad} rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-40`}
          title="Publish"
          aria-label="Publish post"
        >
          {showSpinner && busy
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Eye className="h-4 w-4" />}
        </button>
      )}

      {/* ── Unpublish (published → draft) ─────────────────────────────── */}
      {post.status === 'PUBLISHED' && (
        <button
          onClick={() => onUnpublish(post.id)}
          disabled={busy}
          className={`${pad} rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors disabled:opacity-40`}
          title="Unpublish"
          aria-label="Unpublish post"
        >
          {showSpinner && busy
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <EyeOff className="h-4 w-4" />}
        </button>
      )}

      {/* ── Delete (not for already-deleted posts) ────────────────────── */}
      {post.status !== 'DELETED' && (
        <button
          onClick={() => onDelete(post.id)}
          disabled={busy}
          className={`${pad} rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40`}
          title="Delete"
          aria-label="Delete post"
        >
          {showSpinner && busy
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Trash2 className="h-4 w-4" />}
        </button>
      )}

    </span>
  );
}
