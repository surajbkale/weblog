'use client';

import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewProps, mergeAttributes } from '@tiptap/core';
import ImageExtension from '@tiptap/extension-image';
import { Trash2 } from 'lucide-react';

/**
 * React NodeView for images — adds a delete button overlay that appears on
 * hover (desktop) and on selection (all devices including mobile).
 */
function ImageNodeView({ node, selected, deleteNode }: NodeViewProps) {
  const { src, alt, title } = node.attrs as { src: string; alt?: string; title?: string };

  return (
    <NodeViewWrapper
      className={`editor-image-wrapper group relative inline-block w-full my-6 ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-xl' : ''
      }`}
      data-drag-handle
    >
      <img
        src={src}
        alt={alt ?? ''}
        title={title ?? ''}
        className="editor-image max-w-full h-auto rounded-xl block mx-auto"
        draggable={false}
      />

      {/* Delete overlay — visible on hover OR when the node is selected (mobile) */}
      <div
        className={`
          absolute top-2 right-2 z-10
          transition-opacity duration-150
          ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
        contentEditable={false}
      >
        <button
          onPointerDown={(e) => {
            e.preventDefault(); // prevent focus scroll on mobile
            deleteNode();
          }}
          title="Delete image"
          className="
            flex items-center gap-1.5 px-2.5 py-1.5
            bg-red-600 hover:bg-red-700
            text-white text-xs font-medium
            rounded-lg shadow-lg
            transition-colors
          "
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </NodeViewWrapper>
  );
}

/**
 * ImageWithDelete — Tiptap Image extension upgraded with a React NodeView
 * that provides an accessible delete button on hover/selection.
 */
export const ImageWithDelete = ImageExtension.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
}).configure({
  HTMLAttributes: { class: 'editor-image' },
  allowBase64: false,
});
