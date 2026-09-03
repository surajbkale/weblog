/**
 * Server-side syntax highlighting + sanitization for Tiptap-generated HTML.
 *
 * Tiptap's CodeBlockLowlight adds lowlight highlighting in the EDITOR via
 * ProseMirror decorations, but getHTML() only exports the raw code text with
 * a language class on the <code> element:
 *
 *   <pre><code class="language-javascript">const x = 1;</code></pre>
 *
 * This utility re-highlights those code blocks using rehype-highlight
 * (which uses highlight.js under the hood) and then sanitizes the result
 * with rehype-sanitize — all in a single unified pipeline with zero browser
 * dependencies (no JSDOM, no DOMPurify, no window).
 *
 * Using isomorphic-dompurify is intentionally AVOIDED because it depends on
 * jsdom at runtime, which is NOT bundled in Vercel's production environment,
 * causing a 500 error on every blog post page.
 */

import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import type { Schema } from 'hast-util-sanitize';
import { createHash } from 'crypto';

/**
 * Custom sanitize schema derived from the safe default.
 * Extends it to allow:
 *  - hljs-* classes from rehype-highlight (must come BEFORE sanitize in pipeline)
 *  - language-* classes on <code> elements
 *  - Tiptap media embeds: <iframe>, <video>, <source>, <figure>, <figcaption>
 */
const sanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className', 'class'],
    iframe: ['src', 'allowFullScreen', 'allow', 'frameBorder', 'width', 'height'],
    video:  ['src', 'controls', 'width', 'height'],
    source: ['src', 'type'],
    img:    [...(defaultSchema.attributes?.['img'] ?? []), 'src', 'alt', 'width', 'height'],
    a:      [...(defaultSchema.attributes?.['a'] ?? []), 'target', 'rel'],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'iframe',
    'video',
    'source',
    'figure',
    'figcaption',
  ],
};

// Poor man's LRU cache to prevent unbounded memory growth while
// keeping CPU usage near zero for unchanged posts during ISR revalidations.
const highlightCache = new Map<string, string>();
const MAX_CACHE_SIZE = 250;

/**
 * Processes HTML from the Tiptap editor:
 * 1. Parses it as an HTML fragment (no <html><body> wrapper)
 * 2. Applies rehype-highlight to code blocks
 * 3. Sanitizes with rehype-sanitize (preserves hljs-* classes)
 * 4. Returns the final safe, highlighted HTML string
 */
export async function highlightCodeBlocks(html: string): Promise<string> {
  if (!html) return html;

  const hash = createHash('sha256').update(html).digest('hex');
  if (highlightCache.has(hash)) {
    return highlightCache.get(hash)!;
  }

  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
    })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(html);

  const result = String(file);
  
  if (highlightCache.size >= MAX_CACHE_SIZE) {
    // Clear out the cache completely to prevent memory leaks if we hit the limit
    highlightCache.clear();
  }
  highlightCache.set(hash, result);

  return result;
}
