'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, FileText, ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const NAVIGATION = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Posts', href: '/admin/posts', icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    router.replace('/');
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold tracking-tight">Back to Weblogs</span>
          </Link>
        </div>

        <div className="p-4">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">
            Admin Panel
          </h2>
          <nav className="space-y-1">
            {NAVIGATION.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.displayName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                {user.displayName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Administrator</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
