'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PostListItem } from '@/types/post';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Eye, Clock, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PostCardProps {
  post: PostListItem;
  variant?: 'default' | 'featured' | 'compact' | 'horizontal';
}

export function PostCard({ post, variant = 'default' }: PostCardProps) {
  const publishedDate = post.publishedAt
    ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
    : 'Draft';

  if (variant === 'featured') {
    return (
      <Link href={`/blog/${post.slug}`} className="group relative block rounded-2xl overflow-hidden aspect-[16/9] shadow-md hover:shadow-xl transition-shadow">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 800px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {post.categories[0] && (
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-blue-300 mb-2">
              {post.categories[0].name}
            </span>
          )}
          <h3 className="text-white font-bold text-xl leading-snug line-clamp-2 group-hover:text-blue-200 transition-colors">
            {post.title}
          </h3>
          <div className="flex items-center gap-3 mt-3 text-white/70 text-xs">
            <span>{post.author.displayName}</span>
            <span>·</span>
            <span>{post.readingTimeMinutes} min read</span>
            <span>·</span>
            <span>{publishedDate}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={`/blog/${post.slug}`} className="group flex gap-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:opacity-80 transition-opacity">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
            {post.categories[0]?.name}
          </p>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {post.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{publishedDate}</p>
        </div>
        {post.coverImageUrl && (
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            width={64}
            height={64}
            className="rounded-lg object-cover flex-shrink-0"
          />
        )}
      </Link>
    );
  }

  // Horizontal feed card (image right, text left)
  if (variant === 'horizontal') {
    return (
      <article className="group flex gap-4 sm:gap-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 -mx-2 px-2 rounded-xl transition-colors">
        {/* Text */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
          <div>
            {/* Author row */}
            <Link href={`/author/${post.author.id}`} className="flex items-center gap-2 mb-2">
              {post.author.avatarUrl ? (
                <Image
                  src={post.author.avatarUrl}
                  alt={post.author.displayName}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {(post.author.displayName ?? '?').charAt(0)}
                </div>
              )}
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{post.author.displayName}</span>
            </Link>

            {/* Title */}
            <Link href={`/blog/${post.slug}`}>
              <h2 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1.5">
                {post.title}
              </h2>
            </Link>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 hidden sm:block">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* Footer meta — FIX #17: show tags */}
          <div className="flex items-center gap-3 flex-wrap">
            {post.categories[0] && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                {post.categories[0].name}
              </span>
            )}
            {post.tags.slice(0, 2).map(tag => (
              <Link key={tag.id} href={`/blog?tag=${tag.slug}`}
                className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={e => e.stopPropagation()}>
                #{tag.name}
              </Link>
            ))}
            <span className="text-xs text-gray-400">{post.readingTimeMinutes} min read</span>
            <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
            <span className="text-xs text-gray-400">{publishedDate}</span>
          </div>
        </div>

        {/* Thumbnail */}
        {post.coverImageUrl && (
          <Link href={`/blog/${post.slug}`} className="flex-shrink-0">
            <div className="relative w-24 h-24 sm:w-32 sm:h-24 rounded-xl overflow-hidden">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 96px, 128px"
              />
            </div>
          </Link>
        )}
      </article>
    );
  }

  // Default card
  return (
    <article className="group bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
      {/* Cover image */}
      {post.coverImageUrl && (
        <Link href={`/blog/${post.slug}`}>
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </Link>
      )}

      <div className="p-5">
        {/* Category & reading time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap gap-1.5">
            {post.categories.slice(0, 2).map((cat) => (
              <span key={cat.id} className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                {cat.name}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="h-3 w-3" />
            {post.readingTimeMinutes} min
          </span>
        </div>

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
            {post.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex flex-col pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Link href={`/author/${post.author.id}`} className="flex items-center gap-2 min-w-0">
              {post.author.avatarUrl ? (
                <Image
                  src={post.author.avatarUrl}
                  alt={post.author.displayName}
                  width={28}
                  height={28}
                  className="rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(post.author.displayName ?? '?').charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{post.author.displayName}</p>
                <p className="text-xs text-gray-400">{publishedDate}</p>
              </div>
            </Link>

            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.likeCount}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.commentCount}</span>
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.viewCount}</span>
            </div>
          </div>

          {/* FIX #17: tags row on default card */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 mt-1">
              {post.tags.slice(0, 3).map(tag => (
                <Link key={tag.id} href={`/blog?tag=${tag.slug}`}
                  className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={e => e.stopPropagation()}>
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="flex justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>
  );
}
