import { AuthorSummary } from './post';

export interface CommentResponse {
  id: string;
  postId: string;
  author: AuthorSummary;
  parentId: string | null;
  content: string | null; // null when deleted=true
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentRequest {
  content: string;
  parentId?: string;
}
