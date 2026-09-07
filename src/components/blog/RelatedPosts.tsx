import axios from 'axios';
import { PostListItem } from '@/types/post';
import { ApiResponse } from '@/types/api';
import { PaginatedResponse } from '@/types/post';
import { PostCard } from './PostCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const SSR_API_BASE = process.env.INTERNAL_API_URL || API_BASE;

interface RelatedPostsProps {
  currentPostId: string;
  authorId: string;
  authorName: string;
}

export async function RelatedPosts({ currentPostId, authorId, authorName }: RelatedPostsProps) {
  try {
    // Fetch 4 most recent posts by this author (in case one is the current post, we still have 3 to choose from)
    const res = await axios.get<ApiResponse<PaginatedResponse<PostListItem>>>(
      `${SSR_API_BASE}/api/v1/posts?authorId=${authorId}&sort=newest&size=4`
    );
    
    // Filter out the post currently being read and cap at 2 results for a clean 2-column grid
    const related = res.data.data.content
      .filter((post) => post.id !== currentPostId)
      .slice(0, 2);
      
    if (related.length === 0) {
      return null;
    }

    return (
      <div className="py-10 mb-10 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">
          More from {authorName}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          {related.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    // Fail silently if related posts can't be loaded (e.g. backend error)
    // so we don't crash the entire post detail page
    return null;
  }
}
