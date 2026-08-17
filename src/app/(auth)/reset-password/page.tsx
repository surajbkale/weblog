'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { ApiResponse } from '@/types/api';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]                 = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState(false);
  const [isLoading, setIsLoading]           = useState(false);

  const pwValid  = password.length >= 8;
  const pwMatch  = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = pwValid && pwMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setIsLoading(true);

    try {
      await apiClient.post<ApiResponse<void>>('/api/v1/auth/reset-password', {
        token,
        newPassword: password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to reset password. The link may have expired.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Missing token ─────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="text-center py-2">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/40 ring-4 ring-red-100 dark:ring-red-900/20">
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Invalid link
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
          This password reset link is missing its token. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/25"
        >
          Request new link <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center py-2">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/40 ring-4 ring-green-100 dark:ring-green-900/20">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Password updated!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">
          Your password has been reset. All your active sessions have been signed out for security.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/25"
        >
          Sign in with new password
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Set new password
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose a strong password for your account.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* New password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              minLength={8}
              className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Confirm new password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && !pwMatch && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
              Passwords do not match.
            </p>
          )}
          {confirmPassword.length > 0 && pwMatch && (
            <p className="mt-1.5 text-xs text-green-500 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 shadow-lg shadow-blue-500/25"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Updating…' : 'Reset password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
