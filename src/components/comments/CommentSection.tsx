'use client';

import { useState, useEffect } from 'react';
import { commentsApi } from '@/lib/api/comments';
import { CommentResponse } from '@/types/comment';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Reply, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';

interface CommentSectionProps {
  postId: string;
  commentCount: number;
}

function CommentItem({
  comment,
  onReply,
  onDelete,
}: {
  comment: CommentResponse;
  onReply: (parentId: string) => void;
  onDelete: (id: string) => void;
}) {
  const { user } = useAuth();
  const isOwn = user?.id === comment.author.id;
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  if (comment.deleted) {
    return (
      <div className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <p className="text-sm text-gray-400 dark:text-gray-600 italic">[deleted]</p>
      </div>
    );
  }

  return (
    <div className="py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {comment.author.avatarUrl ? (
          <img src={comment.author.avatarUrl} alt={comment.author.displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(comment.author.displayName ?? '?').charAt(0)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.author.displayName}</span>
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-3 mt-2">
            {user && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Reply className="h-3.5 w-3.5" /> Reply
              </button>
            )}
            {isOwn && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommentSection({ postId, commentCount }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    commentsApi.listByPost(postId)
      .then((r) => setComments(r.data.data.content))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await commentsApi.add(postId, {
        content: newComment.trim(),
        parentId: replyToId ?? undefined,
      });
      setComments((prev) => [res.data.data, ...prev]);
      setNewComment('');
      setReplyToId(null);
    } catch {
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentsApi.delete(id);
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, deleted: true, content: null } : c))
      );
    } catch {
      alert('Failed to delete comment.');
    }
  };

  const replyTarget = replyToId
    ? comments.find((c) => c.id === replyToId)
    : null;

  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white mb-6">
        <MessageCircle className="h-5 w-5" />
        {commentCount} Comment{commentCount !== 1 ? 's' : ''}
      </h2>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTarget && (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 mb-3 text-sm">
              <span className="text-blue-700 dark:text-blue-300">
                Replying to <strong>{replyTarget.author.displayName}</strong>
              </span>
              <button type="button" onClick={() => setReplyToId(null)} className="text-blue-400 hover:text-blue-700 dark:hover:text-blue-200">✕</button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts…"
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-full transition-colors"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 text-center mb-8">
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Sign in</Link>
            {' '}to join the conversation
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-gray-600 py-8">No comments yet. Be the first!</p>
      ) : (
        <div>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onReply={(id) => setReplyToId(id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
