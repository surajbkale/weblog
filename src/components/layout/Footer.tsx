import Link from 'next/link';
import { Rss } from 'lucide-react';


export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Weblogs
            </Link>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              A modern platform for writers and thinkers. Share your stories with the world.
            </p>
            <a
              href="/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 font-medium transition-colors"
            >
              <Rss className="h-4 w-4" />
              RSS Feed
            </a>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Explore</h3>
            <ul className="space-y-2">
              {[
                { href: '/blog', label: 'All Posts' },
                { href: '/blog?sort=popular', label: 'Most Popular' },
                { href: '/blog?sort=newest', label: 'Latest' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Account</h3>
            <ul className="space-y-2">
              {[
                { href: '/login', label: 'Sign In' },
                { href: '/register', label: 'Create Account' },
                { href: '/dashboard', label: 'Dashboard' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            © {year} Weblogs. All rights reserved.
          </p>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Sitemap
          </a>
        </div>
      </div>
    </footer>
  );
}
