// ── Shared sub-types ─────────────────────────────────────────────────────────

export interface AuthorSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
}

export interface TagResponse {
  id: string;
  name: string;
  slug: string;
}

// ── Post list item (no content body — for listing pages) ─────────────────────

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  status: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  author: AuthorSummary;
  categories: CategoryResponse[];
  tags: TagResponse[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  likedByCurrentUser: boolean;
  readingTimeMinutes: number;
  publishedAt: string | null;
  createdAt: string;
}

// ── Full post detail (includes content body) ─────────────────────────────────

export interface PostDetail extends PostListItem {
  content: string;
}

// ── Request payloads ─────────────────────────────────────────────────────────

export interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  coverImageUrl?: string;
  categoryIds?: string[];
  tagNames?: string[];
}

export type UpdatePostRequest = Partial<CreatePostRequest>;

// ── Public author profile ─────────────────────────────────────────────────────

export interface PublicProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  publishedPostCount: number;
  memberSince: string;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
