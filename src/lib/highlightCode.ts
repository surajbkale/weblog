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
    // Allow all class attributes so hljs-* and language-* classes are preserved
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className', 'class'],
    // Allow src/controls on media elements
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

/**
 * Processes HTML from the Tiptap editor:
 * 1. Parses it as an HTML fragment (no <html><body> wrapper)
 * 2. Applies rehype-highlight to code blocks
 * 3. Sanitizes with rehype-sanitize (preserves hljs-* classes)
 * 4. Returns the final safe, highlighted HTML string
 */
export async function highlightCodeBlocks(html: string): Promise<string> {
  if (!html) return html;

  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeHighlight, {
      detect: true,        // auto-detect language if class is missing
      ignoreMissing: true, // don't throw for unknown languages
    })
    // Sanitize AFTER highlight so hljs-* spans are preserved by the schema
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(html);

  return String(file);
}
