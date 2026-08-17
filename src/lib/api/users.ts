import { apiClient } from './client';
import { UserProfileResponse } from '@/types/auth';
import { PublicProfile } from '@/types/post';
import { ApiResponse } from '@/types/api';

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const usersApi = {
  getMe: () =>
    apiClient.get<ApiResponse<UserProfileResponse>>('/api/v1/users/me'),

  updateMe: (data: UpdateProfileRequest) =>
    apiClient.put<ApiResponse<UserProfileResponse>>('/api/v1/users/me', data),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.put<ApiResponse<void>>('/api/v1/users/me/password', data),

  getPublicProfile: (id: string) =>
    apiClient.get<ApiResponse<PublicProfile>>(`/api/v1/users/${id}`),
};
