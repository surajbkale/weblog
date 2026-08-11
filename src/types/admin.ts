export interface AdminUserResponse {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  active: boolean;
  emailVerified: boolean;
  authProvider: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  createdAt: string;
  publishedPostCount: number;
}

export interface AdminPostResponse {
  id: string;
  title: string;
  slug: string;
  status: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  featured: boolean;
  authorDisplayName: string;
  createdAt: string;
  publishedAt: string | null;
}

export interface AdminStatsResponse {
  totalUsers: number;
  totalPosts: number;
  totalPublished: number;
  totalComments: number;
  totalLikes: number;
  totalViews: number;
  newUsersLast7Days: number;
  newPostsLast7Days: number;
  newCommentsLast7Days: number;
  computedAt: string;
}

export interface RoleChangeRequest {
  role: 'USER' | 'ADMIN';
}

export interface UserStatusRequest {
  active: boolean;
}
