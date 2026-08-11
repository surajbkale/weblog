'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { PenSquare, BookOpen, User, ShieldCheck, BarChart3, Eye } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const quickLinks = [
    {
      href: '/dashboard/posts/new',
      icon: PenSquare,
      label: 'New Post',
      description: 'Start writing a new article',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      href: '/dashboard/posts',
      icon: BookOpen,
      label: 'My Posts',
      description: 'Manage all your articles',
      color: 'from-purple-500 to-pink-600',
    },
    {
      href: '/dashboard/profile',
      icon: User,
      label: 'Edit Profile',
      description: 'Update your bio and avatar',
      color: 'from-green-500 to-teal-600',
    },
    ...(user.role === 'ADMIN' ? [{
      href: '/admin',
      icon: ShieldCheck,
      label: 'Admin Panel',
      description: 'Manage users and content',
      color: 'from-orange-500 to-red-600',
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 text-white mb-8 shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h1 className="text-3xl font-bold mb-1">Hey, {user.displayName}! 👋</h1>
            <p className="text-blue-100 text-sm">
              {user.emailVerified
                ? 'Ready to write something great today?'
                : '⚠️ Please verify your email to unlock all features.'}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Published', value: user.publishedPostCount ?? 0, icon: Eye },
            { label: 'Role', value: user.role, icon: ShieldCheck },
            { label: 'Provider', value: user.authProvider, icon: User },
            { label: 'Email', value: user.emailVerified ? 'Verified' : 'Pending', icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <Icon className="h-5 w-5 text-blue-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick action cards */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map(({ href, icon: Icon, label, description, color }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{label}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
