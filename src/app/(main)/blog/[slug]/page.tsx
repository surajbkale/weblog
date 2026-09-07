import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import axios from 'axios';
import { PostDetail } from '@/types/post';
import { ApiResponse } from '@/types/api';
import { LikeButton } from '@/components/blog/LikeButton';
import { CommentSection } from '@/components/comments/CommentSection';
import { ShareButton } from '@/components/blog/ShareButton';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Eye, Clock, MessageCircle, ArrowLeft } from 'lucide-react';
import { highlightCodeBlocks } from '@/lib/highlightCode';
import { BlogContent } from '@/components/blog/BlogContent';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { BookmarkButton } from '@/components/blog/BookmarkButton';
import { ViewTracker } from '@/components/blog/ViewTracker';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
// INTERNAL_API_URL is injected at runtime by Docker for SSR fetches inside the container.
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
        images: post.coverImageUrl 
          ? [post.coverImageUrl] 
          : [`/api/og?title=${encodeURIComponent(post.title)}&author=${encodeURIComponent(post.author.displayName)}`],
      },
      robots: post.status === 'PUBLISHED' ? undefined : {
        index: false,
        follow: false,
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
 * Processes Tiptap-generated HTML for safe, highlighted rendering.
 * highlight + sanitize are done in a single server-side unified pipeline
 * (rehype-highlight → rehype-sanitize) with zero browser dependencies.
 */
async function processContent(html: string): Promise<string> {
  return highlightCodeBlocks(html);
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const renderedContent = await processContent(post.content);

  const publishedDate = post.publishedAt
    ? format(new Date(post.publishedAt), 'MMMM d, yyyy')
    : null;

  return (
    <>
      <ReadingProgress />
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
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4 break-words [overflow-wrap:anywhere]">
        {post.title}
      </h1>

      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <Link href={`/author/${post.author.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
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
        <div className="mb-10 rounded-2xl overflow-hidden relative aspect-video max-h-[480px]">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 848px"
          />
        </div>
      )}

      {/* Post content — sanitized + syntax-highlighted HTML with copy buttons */}
      <BlogContent
        html={renderedContent}
        className="prose-custom text-gray-700 dark:text-gray-300 leading-7 mb-12"
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

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 py-8 border-t border-b border-gray-200 dark:border-gray-700 mb-10">
        <LikeButton
          postId={post.id}
          initialCount={post.likeCount}
          initialLiked={post.likedByCurrentUser}
        />
        <BookmarkButton post={post} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 w-10 h-10" />
        <ShareButton 
          title={post.title} 
          text={post.excerpt ?? undefined} 
        />
      </div>

      {/* Related Posts */}
      <RelatedPosts 
        currentPostId={post.id} 
        authorId={post.author.id} 
        authorName={post.author.displayName} 
      />

      {/* Comments */}
      <CommentSection postId={post.id} commentCount={post.commentCount} />

      {/* Track view silently on mount */}
      <ViewTracker postId={post.id} />
    </div>
    </>
  );
}
