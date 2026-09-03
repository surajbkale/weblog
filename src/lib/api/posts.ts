import { apiClient } from './client';
import {
  PostListItem,
  PostDetail,
  CreatePostRequest,
  UpdatePostRequest,
  PaginatedResponse,
} from '@/types/post';
import { ApiResponse } from '@/types/api';

export type SortOption = 'newest' | 'oldest' | 'popular';

export interface ListPostsParams {
  category?: string;
  tag?: string;
  authorId?: string;
  q?: string;
  sort?: SortOption;
  page?: number;
  size?: number;
}

export const postsApi = {
  list: (params: ListPostsParams = {}) => {
    // Strip empty strings so they are omitted from the query string entirely.
    // The backend SQL uses  CAST(:param AS TEXT) IS NULL  — an empty string ""
    // passes that check as FALSE, causing category/tag/q filters to match nothing.
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== '' && value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return apiClient.get<ApiResponse<PaginatedResponse<PostListItem>>>('/api/v1/posts', { params: cleaned });
  },

  trending: () =>
    apiClient.get<ApiResponse<PostListItem[]>>('/api/v1/posts/trending'),

  featured: () =>
    apiClient.get<ApiResponse<PostListItem[]>>('/api/v1/posts/featured'),

  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<PostDetail>>(`/api/v1/posts/${slug}`),

  getById: (id: string) =>
    apiClient.get<ApiResponse<PostDetail>>(`/api/v1/posts/${id}`),

  myPosts: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PaginatedResponse<PostListItem>>>('/api/v1/posts/me', {
      params: { page, size },
    }),

  create: (data: CreatePostRequest) =>
    apiClient.post<ApiResponse<PostDetail>>('/api/v1/posts', data),

  update: (id: string, data: UpdatePostRequest) =>
    apiClient.put<ApiResponse<PostDetail>>(`/api/v1/posts/${id}`, data),

  publish: (id: string) =>
    apiClient.patch<ApiResponse<PostDetail>>(`/api/v1/posts/${id}/publish`),

  unpublish: (id: string) =>
    apiClient.patch<ApiResponse<PostDetail>>(`/api/v1/posts/${id}/unpublish`),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/api/v1/posts/${id}`),

  like: (postId: string) =>
    apiClient.post<ApiResponse<void>>(`/api/v1/posts/${postId}/like`),

  unlike: (postId: string) =>
    apiClient.delete<ApiResponse<void>>(`/api/v1/posts/${postId}/like`),
};
