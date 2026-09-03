import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import axios from 'axios';
import { PublicProfile, PostListItem, PaginatedResponse } from '@/types/post';
import { ApiResponse } from '@/types/api';
import { PostCard } from '@/components/blog/PostCard';
import { format } from 'date-fns';
import { CalendarDays, BookOpen } from 'lucide-react';

const API_BASE     = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:8080';
// Inside Docker the Next.js server container talks to the Spring Boot container
// via the internal bridge network. INTERNAL_API_URL maps to that address.
// Falls back to the public API_BASE when running locally (no Docker).
const SSR_API_BASE = process.env.INTERNAL_API_URL     || API_BASE;

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await axios.get<ApiResponse<PublicProfile>>(`${API_BASE}/api/v1/users/${id}`);
    const profile = res.data.data;
    return {
      title: `${profile.displayName} | Weblogs`,
      description: profile.bio ?? `Posts by ${profile.displayName}`,
    };
  } catch {
    return { title: 'Author | Weblogs' };
  }
}

export const revalidate = 60;

async function getData(id: string) {
  const [profileRes, postsRes] = await Promise.allSettled([
    axios.get<ApiResponse<PublicProfile>>(`${SSR_API_BASE}/api/v1/users/${id}`),
    axios.get<ApiResponse<PaginatedResponse<PostListItem>>>(
      `${SSR_API_BASE}/api/v1/posts?authorId=${id}&sort=newest&size=20`
    ),
  ]);

  const profile = profileRes.status === 'fulfilled' ? profileRes.value.data.data : null;
  const posts   = postsRes.status   === 'fulfilled' ? postsRes.value.data.data.content : [];
  return { profile, posts };
}

export default async function AuthorPage({ params }: Props) {
  const { id } = await params;
  const { profile, posts } = await getData(id);
  if (!profile) notFound();

  const memberSince = format(new Date(profile.memberSince), 'MMMM yyyy');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Author header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-12">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt={profile.displayName}
            width={96}
            height={96}
            className="mx-auto sm:mx-0 rounded-full object-cover ring-4 ring-white dark:ring-gray-800 shadow-lg"
          />
        ) : (
          <div className="mx-auto sm:mx-0 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
            {(profile.displayName ?? '?').charAt(0)}
          </div>
        )}
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{profile.displayName}</h1>
          {profile.bio && (
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mb-4 leading-relaxed">{profile.bio}</p>
          )}
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {profile.publishedPostCount} post{profile.publishedPostCount !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Member since {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Posts */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Posts by {profile.displayName}
      </h2>
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <p>No published posts yet.</p>
        </div>
      )}
    </div>
  );
}
