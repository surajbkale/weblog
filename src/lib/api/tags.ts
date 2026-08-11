import { apiClient } from './client';
import { TagResponse } from '@/types/post';
import { ApiResponse } from '@/types/api';

export const tagsApi = {
  list: () =>
    apiClient.get<ApiResponse<TagResponse[]>>('/api/v1/tags'),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/api/v1/tags/${id}`),
};
