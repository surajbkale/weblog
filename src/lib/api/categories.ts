import { apiClient } from './client';
import { CategoryResponse } from '@/types/post';
import { ApiResponse } from '@/types/api';

export interface CategoryRequest {
  name: string;
}

export const categoriesApi = {
  list: () =>
    apiClient.get<ApiResponse<CategoryResponse[]>>('/api/v1/categories'),

  create: (data: CategoryRequest) =>
    apiClient.post<ApiResponse<CategoryResponse>>('/api/v1/categories', data),

  update: (id: string, data: CategoryRequest) =>
    apiClient.put<ApiResponse<CategoryResponse>>(`/api/v1/categories/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/api/v1/categories/${id}`),
};
