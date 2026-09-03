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

  /**
   * Delete a media asset from Cloudinary via the backend proxy.
   *
   * @param publicId — Cloudinary public ID (path without file extension),
   *   e.g. "weblog/posts/abc123". Use extractCloudinaryPublicId() to
   *   derive it from a CDN URL.
   *
   * Call this fire-and-forget (.catch(() => {})) — cleanup failure must
   * never block the user-facing action.
   */
  delete: (publicId: string) =>
    apiClient.delete<ApiResponse<void>>(
      `/api/v1/media/${encodeURIComponent(publicId)}`
    ),
};

/**
 * Extracts the Cloudinary public ID (path without extension) from a CDN URL.
 *
 * Cloudinary URL format:
 *   https://res.cloudinary.com/{cloud}/{type}/upload/{version?}/{folder/name}.{ext}
 *
 * Examples:
 *   "…/upload/v1234567/weblog/posts/abc.jpg"  →  "weblog/posts/abc"
 *   "…/upload/weblog/posts/abc.jpg"           →  "weblog/posts/abc"
 *
 * Returns null for non-Cloudinary URLs, empty strings, or parse failures —
 * callers must guard against null before calling mediaApi.delete().
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
