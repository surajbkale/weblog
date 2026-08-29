'use client';

import { BubbleMenu, Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough,
  Code, Link2, Heading2, Heading3, Quote,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface Props {
  editor: Editor;
}

interface ToolBtn {
  icon: React.ElementType;
  label: string;
  action: () => void;
  isActive: () => boolean;
}

export function FloatingToolbar({ editor }: Props) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkHref, setLinkHref] = useState('');

  const applyLink = useCallback(() => {
    const url = linkHref.trim();
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkInput(false);
    setLinkHref('');
  }, [editor, linkHref]);

  const tools: ToolBtn[] = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      icon: Underline,
      label: 'Underline',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
    },
    {
      icon: Strikethrough,
      label: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    },
    {
      icon: Code,
      label: 'Inline code',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code'),
    },
    {
      icon: Heading2,
      label: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
    },
    {
      icon: Heading3,
      label: 'Heading 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive('heading', { level: 3 }),
    },
    {
      icon: Quote,
      label: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote'),
    },
  ];

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150, placement: 'top' }}
      shouldShow={({ editor, state }) => {
        const { selection } = state;
        const { empty } = selection;
        // Don't show for image / video nodes
        if (editor.isActive('image') || editor.isActive('video')) return false;
        return !empty;
      }}
    >
      <div className="bubble-menu flex items-center gap-0.5 bg-gray-900 dark:bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-1">
        {/* Formatting buttons */}
        {tools.map(({ icon: Icon, label, action, isActive }) => (
          <button
            key={label}
            title={label}
            onMouseDown={(e) => { e.preventDefault(); action(); }}
            className={cn(
              'p-1.5 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition-colors',
              isActive() && 'bg-gray-700 text-white'
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}

        {/* Divider */}
        <span className="w-px h-5 bg-gray-600 mx-1" />

        {/* Link button */}
        {showLinkInput ? (
          <div className="flex items-center gap-1 px-1">
            <input
              autoFocus
              value={linkHref}
              onChange={(e) => setLinkHref(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
              placeholder="https://…"
              className="text-xs bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 w-40 outline-none focus:border-blue-400"
            />
            <button
              onMouseDown={(e) => { e.preventDefault(); applyLink(); }}
              className="text-xs text-blue-400 hover:text-blue-300 px-1"
            >
              Apply
            </button>
          </div>
        ) : (
          <button
            title="Link"
            onMouseDown={(e) => {
              e.preventDefault();
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                setLinkHref(editor.getAttributes('link').href ?? '');
                setShowLinkInput(true);
              }
            }}
            className={cn(
              'p-1.5 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition-colors',
              editor.isActive('link') && 'bg-gray-700 text-white'
            )}
          >
            <Link2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </BubbleMenu>
  );
}
