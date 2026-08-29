'use client';

import { FloatingMenu, Editor } from '@tiptap/react';
import {
  Plus, Image, Video, Code2, Minus, List, ListOrdered,
  Quote, X, Link2, Loader2,
} from 'lucide-react';
import { useRef, useState, useCallback } from 'react';
import { mediaApi } from '@/lib/api/media';
import { toEmbedUrl } from './VideoNode';
import { cn } from '@/lib/utils/cn';

interface Props {
  editor: Editor;
}

type BlockType = 'image' | 'video-upload' | 'video-url' | 'code' | 'divider' | 'bullet' | 'ordered' | 'quote';

export function BlockMenu({ editor }: Props) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoUrlMode, setVideoUrlMode] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const closeAll = useCallback(() => {
    setOpen(false);
    setVideoUrlMode(false);
    setVideoUrl('');
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    closeAll();
    try {
      const url = await mediaApi.upload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [editor, closeAll]);

  const handleVideoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    closeAll();
    try {
      const url = await mediaApi.uploadVideo(file);
      editor.chain().focus().setVideo(url).run();
    } catch {
      alert('Video upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [editor, closeAll]);

  const handleVideoUrl = useCallback(() => {
    const raw = videoUrl.trim();
    if (!raw) return;

    const embedUrl = toEmbedUrl(raw);
    if (embedUrl) {
      editor.chain().focus().setVideoEmbed(raw).run();
    } else {
      // Treat as direct video URL
      editor.chain().focus().setVideo(raw).run();
    }
    closeAll();
  }, [editor, videoUrl, closeAll]);

  const handleBlock = useCallback((type: BlockType) => {
    switch (type) {
      case 'image':
        imageInputRef.current?.click();
        setOpen(false);
        break;
      case 'video-upload':
        videoInputRef.current?.click();
        setOpen(false);
        break;
      case 'video-url':
        setVideoUrlMode(true);
        setOpen(false);
        break;
      case 'code':
        editor.chain().focus().toggleCodeBlock().run();
        closeAll();
        break;
      case 'divider':
        editor.chain().focus().setHorizontalRule().run();
        closeAll();
        break;
      case 'bullet':
        editor.chain().focus().toggleBulletList().run();
        closeAll();
        break;
      case 'ordered':
        editor.chain().focus().toggleOrderedList().run();
        closeAll();
        break;
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        closeAll();
        break;
    }
  }, [editor, closeAll]);

  const blocks: { type: BlockType; icon: React.ElementType; label: string; description: string }[] = [
    { type: 'image',        icon: Image,        label: 'Image',         description: 'Upload from your computer' },
    { type: 'video-upload', icon: Video,         label: 'Video',         description: 'Upload a video file' },
    { type: 'video-url',    icon: Link2,         label: 'Embed video',   description: 'YouTube or Vimeo URL' },
    { type: 'code',         icon: Code2,         label: 'Code block',    description: 'Syntax-highlighted code' },
    { type: 'divider',      icon: Minus,         label: 'Divider',       description: 'Horizontal rule' },
    { type: 'bullet',       icon: List,          label: 'Bullet list',   description: 'Unordered list' },
    { type: 'ordered',      icon: ListOrdered,   label: 'Numbered list', description: 'Ordered list' },
    { type: 'quote',        icon: Quote,         label: 'Quote',         description: 'Blockquote section' },
  ];

  return (
    <>
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/mov,video/quicktime" className="hidden" onChange={handleVideoUpload} />

      <FloatingMenu
        editor={editor}
        tippyOptions={{ duration: 150, placement: 'left-start', offset: [0, 16] }}
        shouldShow={({ state }) => {
          const { selection, doc } = state;
          const { $anchor, empty } = selection;
          if (!empty) return false;
          const isRootDepth = $anchor.depth === 1;
          const isEmptyTextBlock =
            $anchor.parent.isTextblock &&
            !$anchor.parent.type.spec.code &&
            $anchor.parent.textContent === '';
          return isRootDepth && isEmptyTextBlock;
        }}
      >
        <div className="relative flex items-center">
          {uploading ? (
            <div className="w-7 h-7 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : (
            <button
              onClick={() => setOpen((v) => !v)}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-full border-2 transition-all duration-150',
                open
                  ? 'border-blue-500 bg-blue-500 text-white rotate-45'
                  : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-500'
              )}
              title="Insert block"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}

          {/* Block picker popup */}
          {open && (
            <div className="absolute left-10 top-0 z-50 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150">
              <div className="flex items-center justify-between px-3 pt-1 pb-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Insert</span>
                <button onClick={closeAll} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {blocks.map(({ type, icon: Icon, label, description }) => (
                <button
                  key={type}
                  onClick={() => handleBlock(type)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 flex items-center justify-center transition-colors flex-shrink-0">
                    <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
                    <p className="text-xs text-gray-400">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Video URL input popup */}
          {videoUrlMode && (
            <div className="absolute left-10 top-0 z-50 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 animate-in fade-in slide-in-from-left-2 duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Embed video</span>
                <button onClick={closeAll} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-2">Paste a YouTube or Vimeo URL</p>
              <input
                autoFocus
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVideoUrl();
                  if (e.key === 'Escape') closeAll();
                }}
                placeholder="https://youtube.com/watch?v=…"
                className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleVideoUrl}
                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Embed
                </button>
                <button
                  onClick={closeAll}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </FloatingMenu>
    </>
  );
}
