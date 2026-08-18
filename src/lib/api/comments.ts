import { apiClient } from './client';
import { CommentResponse, CommentRequest } from '@/types/comment';
import { PaginatedResponse } from '@/types/post';
import { ApiResponse } from '@/types/api';

export const commentsApi = {
  listByPost: (postId: string, page = 0, size = 50) =>
    apiClient.get<ApiResponse<PaginatedResponse<CommentResponse>>>(
      `/api/v1/posts/${postId}/comments`,
      { params: { page, size } }
    ),

  listReplies: (commentId: string, page = 0, size = 50) =>
    apiClient.get<ApiResponse<PaginatedResponse<CommentResponse>>>(
      `/api/v1/comments/${commentId}/replies`,
      { params: { page, size } }
    ),

  add: (postId: string, data: CommentRequest) =>
    apiClient.post<ApiResponse<CommentResponse>>(
      `/api/v1/posts/${postId}/comments`,
      data
    ),

  edit: (commentId: string, data: CommentRequest) =>
    apiClient.put<ApiResponse<CommentResponse>>(
      `/api/v1/comments/${commentId}`,
      data
    ),

  delete: (commentId: string) =>
    apiClient.delete<ApiResponse<void>>(`/api/v1/comments/${commentId}`),
};
