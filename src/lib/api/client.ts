import axios from 'axios';
import { ApiResponse } from '@/types/api';
import { LoginResponse } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending/receiving HttpOnly cookies (refresh_token)
});

// Variable to hold the in-memory access token
let currentAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAccessToken = () => currentAccessToken;

// Request interceptor to attach the access token
apiClient.interceptors.request.use((config) => {
  if (currentAccessToken && config.headers) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

// Response interceptor to handle 401s and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using the HttpOnly cookie
        const response = await axios.post<ApiResponse<LoginResponse>>(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.data.accessToken;
        setAccessToken(newAccessToken);

        // Update the failed request with the new token and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails (e.g. cookie expired), clear token and redirect to login
        setAccessToken(null);
        // Dispatch a custom event to notify the AuthContext to log out the user
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-unauthorized'));
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
