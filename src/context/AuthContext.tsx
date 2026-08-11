'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { UserProfileResponse, LoginResponse } from '@/types/auth';
import { apiClient, setAccessToken } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface AuthContextType {
  user: UserProfileResponse | null;
  isLoading: boolean;
  login: (data: LoginResponse, userProfile: UserProfileResponse) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const login = (data: LoginResponse, userProfile: UserProfileResponse) => {
    setAccessToken(data.accessToken);
    setUser(userProfile);
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (e) {
      console.error('Logout failed on backend', e);
    } finally {
      setAccessToken(null);
      setUser(null);
      router.push('/login');
    }
  };

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      // Step 1: Try to get a fresh access token using the HttpOnly refresh cookie.
      // This is the correct initial auth check — we never call /me without a valid token.
      const refreshRes = await axios.post<ApiResponse<LoginResponse>>(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = refreshRes.data.data.accessToken;
      setAccessToken(newToken);

      // Step 2: Now that we have a valid token in memory, fetch the full user profile.
      const profileRes = await apiClient.get<ApiResponse<UserProfileResponse>>(
        '/api/v1/users/me'
      );
      setUser(profileRes.data.data);
    } catch (error) {
      // Refresh failed (no cookie / cookie expired) — user is not logged in.
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Restore session on every full page load / tab open.
    checkAuth();

    // Listen for unauthorized events dispatched by the Axios interceptor.
    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
