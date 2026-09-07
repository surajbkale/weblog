'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api/admin';
import { AdminPostResponse } from '@/types/admin';
import { useToast } from '@/context/ToastContext';
import { Loader2, Trash2, Star, StarOff, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(''); // empty = all
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const toast = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listPosts(statusFilter || undefined, page, 20);
      setPosts(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
      setTotalElements(res.data.data.totalElements);
    } catch {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const toggleFeatured = async (post: AdminPostResponse) => {
    try {
      await adminApi.setFeatured(post.id, !post.featured);
      toast.success(post.featured ? 'Post unfeatured' : 'Post featured');
      fetchPosts();
    } catch {
      toast.error('Failed to update featured status');
    }
  };

  const hardDelete = async (post: AdminPostResponse) => {
    if (!confirm(`WARNING: This will permanently delete "${post.title}". This action CANNOT be undone. Are you sure?`)) return;
    try {
      await adminApi.hardDeletePost(post.id);
      toast.success('Post permanently deleted');
      fetchPosts();
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const restore = async (post: AdminPostResponse) => {
    if (!confirm(`Restore "${post.title}"?`)) return;
    try {
      await adminApi.restorePost(post.id);
      toast.success('Post restored');
      fetchPosts();
    } catch {
      toast.error('Failed to restore post');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Posts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage, feature, or permanently delete platform content.</p>
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Drafts</option>
            <option value="DELETED">Soft Deleted</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Author</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Featured</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No posts found.
                  </td>
                </tr>
              ) : (
                posts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white max-w-[300px] truncate" title={post.title}>
                        {post.title}
                      </div>
                      <div className="text-gray-500 text-xs truncate max-w-[300px]">/{post.slug}</div>
                    </td>
                    <td className="px-6 py-4">{post.authorDisplayName}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                        post.status === 'PUBLISHED' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                        post.status === 'DRAFT' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {post.featured ? (
                        <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-medium"><Star className="h-3.5 w-3.5 fill-current" /> Yes</span>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => toggleFeatured(post)}
                        className="p-1.5 text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 bg-gray-100 hover:bg-amber-50 dark:bg-gray-800 dark:hover:bg-amber-900/30 rounded transition-colors"
                        title={post.featured ? 'Unfeature Post' : 'Feature Post'}
                      >
                        {post.featured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                      </button>

                      {post.status === 'DELETED' ? (
                        <button
                          onClick={() => restore(post)}
                          className="p-1.5 text-gray-500 hover:text-green-600 dark:hover:text-green-400 bg-gray-100 hover:bg-green-50 dark:bg-gray-800 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Restore Post"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      ) : null}

                      <button
                        onClick={() => hardDelete(post)}
                        className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 bg-gray-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Permanently Delete Post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900 dark:text-white">{page * 20 + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min((page + 1) * 20, totalElements)}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalElements}</span> posts
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
