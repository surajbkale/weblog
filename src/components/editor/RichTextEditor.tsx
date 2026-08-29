'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import { VideoNode } from './VideoNode';
import { FloatingToolbar } from './FloatingToolbar';
import { BlockMenu } from './BlockMenu';
import { useEffect } from 'react';

const lowlight = createLowlight(all);

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Tell your story…',
  editable = true,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // We use CodeBlockLowlight separately for syntax highlighting
        codeBlock: false,
        // Disable the heading shortcut conflicts
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'editor-link', rel: 'noopener noreferrer', target: '_blank' },
      }),
      ImageExtension.configure({
        HTMLAttributes: { class: 'editor-image' },
        allowBase64: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: { class: 'code-block' },
        defaultLanguage: 'plaintext',
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      VideoNode,
    ],
    content: content || '',
    editable,
    editorProps: {
      attributes: {
        class: 'rich-editor prose-custom focus:outline-none',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external content changes (e.g. loading existing post in edit page)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (content !== currentHtml) {
      editor.commands.setContent(content || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  // Sync editable flag
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  if (!editor) return null;

  return (
    <div className="rich-editor-wrapper relative">
      {editable && <FloatingToolbar editor={editor} />}
      {editable && <BlockMenu editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
