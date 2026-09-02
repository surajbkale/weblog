'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { UserProfileResponse, LoginResponse } from '@/types/auth';
import { apiClient, setAccessToken } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ── Session hint key (localStorage) ──────────────────────────────────────────
// WHY localStorage, not a cookie:
// The backend (weblogapi.lumenvault.live) sets the `session_hint` cookie on its
// own domain. In production, document.cookie on the frontend domain
// (weblog.lumenvault.live) can NEVER read a cookie set by a different subdomain.
// localStorage is scoped to the current origin, so it works reliably in both
// localhost and cross-subdomain production environments.
const SESSION_HINT_KEY = 'has_session';

export const markSessionActive  = () => localStorage.setItem(SESSION_HINT_KEY, '1');
export const clearSessionHint   = () => localStorage.removeItem(SESSION_HINT_KEY);
export const hasActiveSession   = () => localStorage.getItem(SESSION_HINT_KEY) === '1';

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
    markSessionActive(); // persist hint so checkAuth fires on next page load
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (e) {
      console.error('Logout failed on backend', e);
    } finally {
      setAccessToken(null);
      setUser(null);
      clearSessionHint(); // clear so checkAuth is skipped for guest on next load
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
      markSessionActive(); // keep hint alive on successful refresh
    } catch {
      // Refresh failed (cookie missing, expired, or revoked) — guest user.
      setAccessToken(null);
      setUser(null);
      clearSessionHint(); // token gone — clear hint to skip future calls
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ── Guard: skip on OAuth callback page ───────────────────────────────────
    // OAuthCallbackPage calls /refresh itself. If we also call it here, we
    // create a race where two concurrent requests try to rotate the same token,
    // which can trigger the backend's reuse-detection logic.
    if (window.location.pathname === '/oauth/callback') {
      setIsLoading(false);
      return;
    }

    // ── Guard: skip if no active session ─────────────────────────────────────
    // Check localStorage instead of document.cookie.
    //
    // WHY: The backend sets its `session_hint` cookie on weblogapi.lumenvault.live.
    // In production, document.cookie on weblog.lumenvault.live (a different
    // subdomain) cannot read cookies from another subdomain — they are scoped
    // to the domain that set them. localStorage is origin-scoped and always
    // readable by the frontend, making it the reliable choice here.
    //
    // When no hint exists the user is definitely a guest — skip both API calls
    // (avoids two wasted requests on public pages for unauthenticated visitors).
    if (!hasActiveSession()) {
      setIsLoading(false);
      return;
    }

    // Restore session on every full page load / tab open.
    checkAuth();

    // Listen for unauthorized events dispatched by the Axios interceptor.
    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
      clearSessionHint();
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
