'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing from the URL. Please use the link from your email.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await apiClient.post<ApiResponse<void>>('/api/v1/auth/verify-email', { token });
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully. You can now sign in.');
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            'Failed to verify email. The link may be invalid or expired.',
        );
      }
    };

    verifyToken();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail || resendLoading) return;
    setResendLoading(true);
    try {
      await apiClient.post<ApiResponse<void>>('/api/v1/auth/resend-verification', {
        email: resendEmail.trim().toLowerCase(),
      });
      setResendSent(true);
    } catch {
      // Silently fail — backend always returns generic success
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="text-center py-2">
      {/* Loading */}
      {status === 'loading' && (
        <>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40 ring-4 ring-blue-100 dark:ring-blue-900/20">
            <Loader2 className="h-7 w-7 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Verifying your email…
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This will only take a moment.
          </p>
        </>
      )}

      {/* Success */}
      {status === 'success' && (
        <>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/40 ring-4 ring-green-100 dark:ring-green-900/20">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Email verified!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">
            {message}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/25"
          >
            Sign in to your account
          </Link>
        </>
      )}

      {/* Error */}
      {status === 'error' && (
        <>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/40 ring-4 ring-red-100 dark:ring-red-900/20">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Verification failed
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
            {message}
          </p>

          {/* Resend section */}
          {!resendSent ? (
            <div className="text-left bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-5">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                Request a new verification email
              </p>
              <form onSubmit={handleResend} className="flex gap-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {resendLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Resend
                </button>
              </form>
            </div>
          ) : (
            <div className="mb-5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              If an unverified account with that email exists, we&apos;ve sent a new link.
            </div>
          )}

          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold rounded-xl transition-colors"
          >
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
