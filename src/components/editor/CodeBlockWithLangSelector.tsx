'use client';

import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewProps } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import { useState, useCallback } from 'react';
import { Check, ChevronDown, Code2 } from 'lucide-react';

const lowlight = createLowlight(all);

// Most commonly used languages for the selector
const LANGUAGES = [
  { value: 'plaintext', label: 'Plain text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'xml', label: 'XML' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'r', label: 'R' },
  { value: 'matlab', label: 'MATLAB' },
];

function CodeBlockNodeView({ node, updateAttributes, extension }: NodeViewProps) {
  const [open, setOpen] = useState(false);
  const language = node.attrs.language as string || 'plaintext';
  const selected = LANGUAGES.find(l => l.value === language) ?? LANGUAGES[0];

  const selectLang = useCallback((value: string) => {
    updateAttributes({ language: value });
    setOpen(false);
  }, [updateAttributes]);

  return (
    <NodeViewWrapper className="code-block-wrapper relative my-6 group">
      {/* Language selector bar */}
      <div className="code-block-toolbar flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-xl border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-400 font-mono">code</span>
        </div>

        {/* Language picker */}
        <div className="relative">
          <button
            contentEditable={false}
            onClick={() => setOpen(v => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Select language"
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-2.5 py-1 rounded transition-colors"
          >
            {selected.label}
            <ChevronDown className="h-3 w-3" />
          </button>

          {open && (
            <div
              contentEditable={false}
              role="listbox"
              className="absolute right-0 top-full mt-1 z-50 w-44 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-y-auto max-h-64 py-1"
            >
              {LANGUAGES.map(lang => (
                <button
                  key={lang.value}
                  role="option"
                  aria-selected={lang.value === language}
                  onClick={() => selectLang(lang.value)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  {lang.label}
                  {lang.value === language && <Check className="h-3 w-3 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Code content — NodeViewContent renders the editable code area */}
      <pre className="code-block-pre rounded-t-none rounded-b-xl m-0">
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

/**
 * CodeBlockWithLangSelector — CodeBlockLowlight extension with:
 * - A React NodeView that renders a language picker in the toolbar
 * - Tab key inserts 2 spaces instead of moving browser focus
 */
export const CodeBlockWithLangSelector = CodeBlockLowlight.extend({
  addKeyboardShortcuts() {
    return {
      // Tab → insert 2 spaces (prevent browser focus jump)
      Tab: ({ editor }) => {
        if (!editor.isActive('codeBlock')) return false;
        return editor.commands.insertContent('  ');
      },
      // Shift+Tab → no-op inside code blocks (don't move focus out)
      'Shift-Tab': ({ editor }) => {
        if (!editor.isActive('codeBlock')) return false;
        return true; // consume the event
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  },
}).configure({
  lowlight,
  defaultLanguage: 'plaintext',
});
