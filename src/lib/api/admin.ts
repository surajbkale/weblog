import { apiClient } from './client';
import {
  AdminUserResponse,
  AdminPostResponse,
  AdminStatsResponse,
  RoleChangeRequest,
  UserStatusRequest,
} from '@/types/admin';
import { PaginatedResponse } from '@/types/post';
import { ApiResponse } from '@/types/api';
import { PostListItem } from '@/types/post';

export const adminApi = {
  // Stats
  getStats: () =>
    apiClient.get<ApiResponse<AdminStatsResponse>>('/api/v1/admin/stats'),

  // Users
  listUsers: (q?: string, page = 0, size = 20) =>
    apiClient.get<ApiResponse<PaginatedResponse<AdminUserResponse>>>('/api/v1/admin/users', {
      params: { q, page, size },
    }),

  changeRole: (id: string, data: RoleChangeRequest) =>
    apiClient.patch<ApiResponse<AdminUserResponse>>(`/api/v1/admin/users/${id}/role`, data),

  setUserStatus: (id: string, data: UserStatusRequest) =>
    apiClient.patch<ApiResponse<AdminUserResponse>>(`/api/v1/admin/users/${id}/status`, data),

  // Posts
  listPosts: (status?: string, page = 0, size = 20) =>
    apiClient.get<ApiResponse<PaginatedResponse<AdminPostResponse>>>('/api/v1/admin/posts', {
      params: { status, page, size },
    }),

  hardDeletePost: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/api/v1/admin/posts/${id}`),

  restorePost: (id: string) =>
    apiClient.patch<ApiResponse<AdminPostResponse>>(`/api/v1/admin/posts/${id}/restore`),

  setFeatured: (id: string, featured: boolean) =>
    apiClient.patch<ApiResponse<AdminPostResponse>>(`/api/v1/admin/posts/${id}/featured`, null, {
      params: { featured },
    }),
};
