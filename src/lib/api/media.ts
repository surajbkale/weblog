import { apiClient } from './client';
import { ApiResponse } from '@/types/api';

export const mediaApi = {
  /**
   * Upload an image file to Cloudinary via backend proxy.
   * Returns the secure CDN URL.
   * Rate-limited to 20 uploads per hour per user.
   */
  upload: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<ApiResponse<{ url: string }>>(
      '/api/v1/media/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return res.data.data.url;
  },

  /**
   * Upload a video file (mp4/webm/mov) to Cloudinary via backend proxy.
   * Returns the secure CDN URL.
   * Max size: 50 MB. Rate-limited to 20 uploads per hour per user.
   */
  uploadVideo: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<ApiResponse<{ url: string }>>(
      '/api/v1/media/upload/video',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return res.data.data.url;
  },
};
