import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6">
        <span className="text-8xl font-black text-gray-900 dark:text-white">404</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Page not found</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        The page you're looking for doesn't exist or may have been removed.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-full text-sm transition-colors">
          <Home className="h-4 w-4" /> Go home
        </Link>
        <Link href="/blog"
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-full text-sm transition-colors">
          <Search className="h-4 w-4" /> Browse posts
        </Link>
      </div>
    </div>
  );
}
