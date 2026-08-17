export interface UserProfileResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: 'USER' | 'ADMIN';
  authProvider: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  emailVerified: boolean;
  publishedPostCount: number;
  memberSince: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}
