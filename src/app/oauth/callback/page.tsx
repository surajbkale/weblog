'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Loader2, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth, markSessionActive } from '@/context/AuthContext';
import { apiClient, setAccessToken } from '@/lib/api/client';
import { LoginResponse, UserProfileResponse } from '@/types/auth';
import { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * OAuth2 Callback Page
 *
 * The backend OAuth2LoginSuccessHandler sets an HttpOnly refresh-token cookie
 * and redirects the browser here. We complete the auth flow by:
 *   1. Calling POST /api/v1/auth/refresh (sends the cookie automatically)
 *   2. Using the returned access token to fetch the user profile from /api/v1/users/me
 *   3. Updating global auth state and redirecting to /dashboard
 */
export default function OAuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const completeOAuthLogin = async () => {
      try {
        // Step 1: Exchange the HttpOnly refresh cookie for an access token
        const refreshRes = await axios.post<ApiResponse<LoginResponse>>(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const loginData = refreshRes.data.data;
        setAccessToken(loginData.accessToken);

        // Step 2: Fetch the user profile with the new access token
        const profileRes = await apiClient.get<ApiResponse<UserProfileResponse>>(
          '/api/v1/users/me',
          { headers: { Authorization: `Bearer ${loginData.accessToken}` } },
        );

        // Step 3: Update global auth state
        markSessionActive(); // persist hint so page refresh retriggers checkAuth
        login(loginData, profileRes.data.data);

        // Step 4: Redirect to dashboard
        router.replace('/dashboard');
      } catch (err: any) {
        const msg =
          err.response?.data?.message ||
          'Sign-in failed. The session may have expired. Please try again.';
        setError(msg);
      }
    };

    completeOAuthLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 transition-colors">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Weblogs
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xl shadow-gray-900/5 dark:shadow-black/30 p-8 text-center">
        {!error ? (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40 ring-4 ring-blue-100 dark:ring-blue-900/20">
              <Loader2 className="h-7 w-7 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Completing sign-in…
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Just a moment while we set up your session.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/40 ring-4 ring-red-100 dark:ring-red-900/20">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Sign-in failed
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {error}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/25"
            >
              Try again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
