import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import axios from 'axios';
import { PostDetail } from '@/types/post';
import { ApiResponse } from '@/types/api';
import { LikeButton } from '@/components/blog/LikeButton';
import { CommentSection } from '@/components/comments/CommentSection';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { Eye, Clock, MessageCircle, ArrowLeft } from 'lucide-react';
import { codeToHtml } from 'shiki';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await axios.get<ApiResponse<PostDetail>>(
      `${API_BASE}/api/v1/posts/${slug}`
    );
    const post = res.data.data;
    return {
      title: `${post.title} | Weblogs`,
      description: post.excerpt ?? `A post by ${post.author.displayName}`,
      openGraph: {
        title: post.title,
        description: post.excerpt ?? '',
        images: post.coverImageUrl ? [post.coverImageUrl] : [],
      },
    };
  } catch {
    return { title: 'Post | Weblogs' };
  }
}

export const revalidate = 60; // ISR: revalidate every 60 seconds

async function getPost(slug: string): Promise<PostDetail | null> {
  try {
    const res = await axios.get<ApiResponse<PostDetail>>(
      `${API_BASE}/api/v1/posts/${slug}`
    );
    return res.data.data;
  } catch {
    return null;
  }
}

/**
 * Server-side syntax highlight all fenced code blocks inside Markdown HTML.
 * We replace ```lang\ncode\n``` patterns with shiki-highlighted HTML.
 */
async function highlightCode(markdown: string): Promise<string> {
  // Simple regex to find fenced code blocks
  const fenceRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const replacements: { from: string; to: string }[] = [];

  for (const match of markdown.matchAll(fenceRegex)) {
    const [full, lang = 'plaintext', code] = match;
    try {
      const html = await codeToHtml(code.trimEnd(), {
        lang,
        theme: 'github-dark',
      });
      replacements.push({ from: full, to: html });
    } catch {
      // if shiki doesn't know the lang, keep as-is
    }
  }

  let result = markdown;
  for (const { from, to } of replacements) {
    result = result.replace(from, to);
  }
  return result;
}

/** Very lightweight Markdown → HTML converter for basic post rendering */
function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-8 mb-3 text-gray-900 dark:text-white">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-white">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-10 mb-4 text-gray-900 dark:text-white">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 underline hover:no-underline" target="_blank" rel="noopener">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="my-4 space-y-1">$&</ul>')
    .replace(/\n\n/g, '</p><p class="my-4 leading-7 text-gray-700 dark:text-gray-300">')
    .replace(/^(?!<[h|u|b|l|a])(.+)$/, '<p class="my-4 leading-7 text-gray-700 dark:text-gray-300">$1</p>');
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const highlightedContent = await highlightCode(post.content);
  const renderedContent = mdToHtml(highlightedContent);

  const publishedDate = post.publishedAt
    ? format(new Date(post.publishedAt), 'MMMM d, yyyy')
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </Link>

      {/* Categories */}
      {post.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.categories.map((cat) => (
            <Link key={cat.id} href={`/blog?category=${cat.slug}`}
              className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
        {post.title}
      </h1>

      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <Link href={`/author/${post.author.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt={post.author.displayName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
              {(post.author.displayName ?? '?').charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{post.author.displayName}</p>
            {publishedDate && <p className="text-xs text-gray-400">{publishedDate}</p>}
          </div>
        </Link>
        <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500 ml-auto">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{post.readingTimeMinutes} min read</span>
          <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{post.viewCount.toLocaleString()}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{post.commentCount}</span>
        </div>
      </div>

      {/* Cover image */}
      {post.coverImageUrl && (
        <div className="mb-10 rounded-2xl overflow-hidden">
          <img src={post.coverImageUrl} alt={post.title} className="w-full h-auto max-h-[480px] object-cover" />
        </div>
      )}

      {/* Post content */}
      <article
        className="prose-custom text-gray-700 dark:text-gray-300 leading-7 mb-12"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          {post.tags.map((tag) => (
            <Link key={tag.id} href={`/blog?tag=${tag.slug}`}
              className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Like button */}
      <div className="flex items-center justify-center py-8 border-t border-b border-gray-200 dark:border-gray-700 mb-10">
        <LikeButton
          postId={post.id}
          initialCount={post.likeCount}
          initialLiked={post.likedByCurrentUser}
        />
      </div>

      {/* Comments */}
      <CommentSection postId={post.id} commentCount={post.commentCount} />
    </div>
  );
}
