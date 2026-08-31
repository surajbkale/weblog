'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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

  // ── Guards ──────────────────────────────────────────────────────────────────
  // React 18 Strict Mode double-invokes effects in development. Without this
  // guard, checkAuth() fires twice: the first call rotates the refresh token,
  // the second call receives the now-revoked token → backend detects "reuse
  // attack" → revokes ALL sessions → user is logged out on every Ctrl+R.
  const isRefreshing = useRef(false);

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
    // Prevent concurrent refresh calls (covers Strict Mode double-invoke AND
    // multiple tabs racing on page load).
    if (isRefreshing.current) return;
    isRefreshing.current = true;

    setIsLoading(true);
    try {
      // Step 1: Exchange the HttpOnly refresh cookie for a fresh access token.
      const refreshRes = await axios.post<ApiResponse<LoginResponse>>(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = refreshRes.data.data.accessToken;
      setAccessToken(newToken);

      // Step 2: Fetch the full user profile using the new token.
      const profileRes = await apiClient.get<ApiResponse<UserProfileResponse>>(
        '/api/v1/users/me'
      );
      setUser(profileRes.data.data);
    } catch {
      // Refresh failed (cookie missing, expired, or revoked) — guest user.
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
      isRefreshing.current = false;
    }
  };

  useEffect(() => {
    // Only attempt the refresh round-trip when the lightweight session_hint
    // cookie is present. Without it the user is definitely a guest — skip
    // both API calls entirely (avoids two wasted requests on public pages).
    const hasHint = document.cookie
      .split(';')
      .some(c => c.trim().startsWith('session_hint='));

    if (!hasHint) {
      setIsLoading(false);
      return;
    }

    checkAuth();

    // Listen for 401s that the Axios interceptor cannot recover from.
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
