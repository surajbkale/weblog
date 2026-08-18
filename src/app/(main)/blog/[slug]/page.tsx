import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import axios from 'axios';
import { PostDetail } from '@/types/post';
import { ApiResponse } from '@/types/api';
import { LikeButton } from '@/components/blog/LikeButton';
import { CommentSection } from '@/components/comments/CommentSection';
import Link from 'next/link';
import { format } from 'date-fns';
import { Eye, Clock, MessageCircle, ArrowLeft } from 'lucide-react';
import { codeToHtml } from 'shiki';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
// INTERNAL_API_URL is injected at runtime by Docker for SSR fetches inside the container.
// The frontend container cannot reach the API via `localhost` (resolves to itself);
// host.docker.internal maps to the host where the API runs on port 8080.
const SSR_API_BASE = process.env.INTERNAL_API_URL || API_BASE;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await axios.get<ApiResponse<PostDetail>>(
      `${SSR_API_BASE}/api/v1/posts/${slug}`
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

/**
 * Pre-build the 20 most recently published post slugs at build time.
 * Any slug not in this list is rendered on-demand (ISR, revalidate = 60s).
 */
export async function generateStaticParams() {
  try {
    const res = await axios.get<ApiResponse<{ content: Array<{ slug: string }> }>>(
      `${SSR_API_BASE}/api/v1/posts?sort=newest&size=20`
    );
    return res.data.data.content.map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}

export const revalidate = 60; // ISR: revalidate every 60 seconds

async function getPost(slug: string): Promise<PostDetail | null> {
  try {
    const res = await axios.get<ApiResponse<PostDetail>>(
      `${SSR_API_BASE}/api/v1/posts/${slug}`
    );
    return res.data.data;
  } catch {
    return null;
  }
}

/**
 * Server-side syntax highlight all fenced code blocks inside Markdown HTML.
 * We replace ```lang\ncode\n``` patterns with shiki-highlighted HTML before
 * passing the result to marked, so shiki blocks are preserved as-is.
 */
async function highlightCode(markdown: string): Promise<string> {
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

/**
 * Renders Markdown to HTML using the `marked` library (same as the editor preview),
 * then sanitizes the output with DOMPurify to prevent XSS from user-supplied content.
 */
async function renderContent(markdown: string): Promise<string> {
  // Replace fenced code blocks with Shiki-highlighted HTML first
  const withHighlights = await highlightCode(markdown);

  // Use marked for consistent, complete Markdown rendering (handles tables,
  // ordered lists, nested elements, inline code — all the things mdToHtml missed)
  const { marked } = await import('marked');
  const rawHtml = marked.parse(withHighlights, { async: false }) as string;

  // Sanitize on the server with isomorphic-dompurify to eliminate XSS risk
  const DOMPurify = (await import('isomorphic-dompurify')).default;
  return DOMPurify.sanitize(rawHtml);
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const renderedContent = await renderContent(post.content);

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

      {/* Post content — sanitized server-side by DOMPurify */}
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
