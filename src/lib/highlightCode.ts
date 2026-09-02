/**
 * Server-side syntax highlighting for Tiptap-generated HTML.
 *
 * Tiptap's CodeBlockLowlight adds lowlight highlighting in the EDITOR via
 * ProseMirror decorations, but getHTML() only exports the raw code text with
 * a language class on the <code> element:
 *
 *   <pre><code class="language-javascript">const x = 1;</code></pre>
 *
 * This utility re-highlights those code blocks using rehype-highlight
 * (which uses highlight.js under the hood) so the published blog has
 * proper syntax-highlighted HTML.
 *
 * DOMPurify sanitization should still run AFTER this step.
 */

import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

/**
 * Processes HTML from the Tiptap editor:
 * 1. Parses it as an HTML fragment
 * 2. Applies rehype-highlight to code blocks
 * 3. Returns the highlighted HTML string
 */
export async function highlightCodeBlocks(html: string): Promise<string> {
  if (!html || !html.includes('<code')) return html;

  const file = await unified()
    .use(rehypeParse, { fragment: true })   // parse as fragment (no <html><body> wrapper)
    .use(rehypeHighlight, {
      detect: true,          // auto-detect language if class is missing
      ignoreMissing: true,   // don't throw for unknown languages
    })
    .use(rehypeStringify)
    .process(html);

  return String(file);
}
