'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ImageWithDelete } from './ImageNodeView';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { VideoNode } from './VideoNode';
import { TrailingNode } from './TrailingNode';
import { FloatingToolbar } from './FloatingToolbar';
import { BlockMenu } from './BlockMenu';
import { CodeBlockWithLangSelector } from './CodeBlockWithLangSelector';
import { useEffect, useCallback } from 'react';

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
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'editor-link', rel: 'noopener noreferrer', target: '_blank' },
      }),
      ImageWithDelete,
      CodeBlockWithLangSelector,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      VideoNode,
      // Always keeps an empty paragraph at the end of the document so the
      // cursor can always land below any block-level media node.
      TrailingNode,
    ],
    content: content || '',
    editable,
    editorProps: {
      attributes: {
        // pl-8 carves a left gutter (32px) for the BlockMenu + button.
        // The button is absolutely positioned inside rich-editor-wrapper at left:0,
        // so it sits in this gutter — always visible on every screen width.
        class: 'rich-editor prose-custom focus:outline-none pl-8',
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

  /**
   * When the user clicks in the empty space BELOW all editor content,
   * move the cursor to the end of the document. Without this, clicking
   * below a block-level node in a short document does nothing because the
   * click lands on the wrapper div, not on any ProseMirror node.
   */
  const handleWrapperClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor || !editable) return;

    const proseMirrorEl = e.currentTarget.querySelector<HTMLElement>('.ProseMirror');
    if (!proseMirrorEl) return;

    const rect = proseMirrorEl.getBoundingClientRect();
    // If the click is below the ProseMirror content, focus the end
    if (e.clientY > rect.bottom) {
      editor.commands.focus('end');
    }
  }, [editor, editable]);

  if (!editor) return null;

  return (
    <div
      className="rich-editor-wrapper relative overflow-visible"
      onClick={handleWrapperClick}
    >
      {editable && <FloatingToolbar editor={editor} />}
      {editable && <BlockMenu editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
