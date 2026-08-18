import { marked } from 'marked';

/**
 * Converts a Markdown string to HTML.
 * Used both in the post detail page (server-side) and in the editor preview (client-side).
 * NOTE: Always sanitise with DOMPurify on the client if accepting user-generated content
 * beyond your own authors' posts.
 */
export function mdToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
