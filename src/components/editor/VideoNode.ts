import { Node, mergeAttributes } from '@tiptap/core';

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
 * Custom Tiptap node that can render either:
 * - A native <video> element for uploaded Cloudinary videos
 * - A responsive <iframe> for YouTube / Vimeo embeds
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

  addCommands() {
    return {
      setVideo:
        (src: string, caption = '') =>
        ({ commands }) =>
          // Insert the video node followed by an empty paragraph so the
          // cursor has a text block to land in after the media.
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
