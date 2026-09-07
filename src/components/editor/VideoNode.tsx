'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewProps } from '@tiptap/core';
import { Trash2 } from 'lucide-react';

export interface VideoOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      /** Insert a hosted video (Cloudinary URL) */
      setVideo: (src: string, caption?: string) => ReturnType;
      /** Insert a YouTube / Vimeo iframe embed */
      setVideoEmbed: (url: string) => ReturnType;
    };
  }
}

/** Converts a YouTube / Vimeo share URL into an embed URL. Returns null if not recognised. */
export function toEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());

    // YouTube: youtu.be/<id> or youtube.com/watch?v=<id>
    if (url.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${url.pathname}`;
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }

    // Vimeo: vimeo.com/<id>
    if (url.hostname.includes('vimeo.com')) {
      const id = url.pathname.replace(/^\//, '');
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    // not a valid URL
  }
  return null;
}

/**
 * React NodeView for video nodes — renders the video/iframe AND a delete
 * button overlay shown on hover (desktop) or when the node is selected (mobile).
 */
function VideoNodeView({ node, selected, deleteNode }: NodeViewProps) {
  const { src, embed, caption } = node.attrs as {
    src: string;
    embed: boolean;
    caption: string;
  };

  return (
    <NodeViewWrapper
      className={`video-node group relative my-6 ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-xl' : ''
      }`}
      data-drag-handle
    >
      {/* Media */}
      {embed ? (
        <div className="video-embed-wrapper">
          <iframe
            src={src}
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="video-embed-iframe"
          />
        </div>
      ) : (
        <video src={src} controls className="video-native" />
      )}

      {caption && (
        <figcaption className="video-caption">{caption}</figcaption>
      )}

      {/* Delete overlay — hover (desktop) or selected (mobile) */}
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
          title="Delete video"
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
 * Custom Tiptap node that can render either:
 * - A native <video> element for uploaded Cloudinary videos
 * - A responsive <iframe> for YouTube / Vimeo embeds
 *
 * Now uses a React NodeView so the Delete button overlay is always available.
 */
export const VideoNode = Node.create<VideoOptions>({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      src:     { default: null },
      embed:   { default: false },  // true → <iframe>, false → <video>
      caption: { default: '' },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="video"]' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { src, embed, caption } = node.attrs as { src: string; embed: boolean; caption: string };

    const wrapper: [string, Record<string, unknown>, ...unknown[]] = [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'video',
        class: 'video-node my-6',
      }),
    ];

    if (embed) {
      wrapper.push([
        'div',
        { class: 'video-embed-wrapper' },
        ['iframe', {
          src,
          frameborder: '0',
          allowfullscreen: 'true',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          class: 'video-embed-iframe',
        }],
      ]);
    } else {
      wrapper.push([
        'video',
        { src, controls: 'true', class: 'video-native' },
      ]);
    }

    if (caption) {
      wrapper.push(['figcaption', { class: 'video-caption' }, caption]);
    }

    return wrapper;
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },

  addCommands() {
    return {
      setVideo:
        (src: string, caption = '') =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs: { src, embed: false, caption } },
            { type: 'paragraph' },
          ]),

      setVideoEmbed:
        (url: string) =>
        ({ commands }) => {
          const embedUrl = toEmbedUrl(url);
          if (!embedUrl) return false;
          return commands.insertContent([
            { type: this.name, attrs: { src: embedUrl, embed: true, caption: '' } },
            { type: 'paragraph' },
          ]);
        },
    };
  },
});
