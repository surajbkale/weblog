import { MetadataRoute } from 'next';
import axios from 'axios';

const SSR_API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8080';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface PostSlug {
  slug: string;
  publishedAt?: string;
  updatedAt?: string;
}

async function getAllPostSlugs(): Promise<PostSlug[]> {
  try {
    // Fetch up to 500 slugs — adjust `size` based on content volume
    const res = await axios.get<{ data: { content: PostSlug[] } }>(
      `${SSR_API_BASE}/api/v1/posts?sort=newest&size=500`
    );
    return res.data.data.content;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPostSlugs();

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...postEntries,
  ];
}
