import React from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

const quotes = [
  {
    text: "Writing is thinking. To write well is to think clearly. That\u2019s why it\u2019s so hard.",
    author: 'David McCullough',
  },
  {
    text: 'Either write something worth reading or do something worth writing.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'Fill your paper with the breathings of your heart.',
    author: 'William Wordsworth',
  },
];

// Deterministic quote based on date — changes daily without client mismatch
const quote = quotes[new Date().getDate() % quotes.length];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950 transition-colors">

      {/* ── Left decorative panel (desktop only) ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-900">

        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-sky-400/10 blur-2xl" />
        </div>

        {/* Dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 group w-fit">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">Weblogs</span>
        </Link>

        {/* Quote block */}
        <div className="relative">
          <div className="text-6xl text-white/10 font-serif leading-none select-none mb-4">&ldquo;</div>
          <blockquote className="text-xl font-medium text-white/90 leading-relaxed mb-4 max-w-sm">
            {quote.text}
          </blockquote>
          <p className="text-sm text-blue-300/80 font-medium">— {quote.author}</p>
        </div>

        {/* Bottom tagline */}
        <div className="relative">
          <p className="text-xs text-white/40 uppercase tracking-widest">
            A modern platform for writers
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-center pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Weblogs
            </span>
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:py-14">
          <div className="w-full max-w-md">
            {/* Glass card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xl shadow-gray-900/5 dark:shadow-black/30 p-8 sm:p-10">
              {children}
            </div>

            {/* Footer note */}
            <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
              © {new Date().getFullYear()} Weblogs. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
