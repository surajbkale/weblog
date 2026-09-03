'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '@/lib/api/posts';
import { categoriesApi } from '@/lib/api/categories';
import { CategoryResponse, PostDetail } from '@/types/post';
import { ArrowLeft, Send, Save, Loader2, PenLine, Settings2 } from 'lucide-react';
import { mediaApi } from '@/lib/api/media';
import { extractCloudinaryPublicId } from '@/lib/api/media';
import { cn } from '@/lib/utils/cn';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { PostEditorSidebar } from '@/components/editor/PostEditorSidebar';
import { useToast } from '@/context/ToastContext';

interface Props { params: Promise<{ id: string }>; }

export default function EditPostPage({ params }: Props) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [postId, setPostId] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.list();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 60,
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('DRAFT');

  // Mobile tab: 'write' shows editor, 'settings' shows sidebar metadata
  const [mobileTab, setMobileTab] = useState<'write' | 'settings'>('write');

  // Tracks cover URLs uploaded during THIS editing session.
  // We only fire cleanup deletes for these — never for the server-loaded original
  // (the backend handles that when the post is saved with a different coverImageUrl).
  const sessionUploadsRef = useRef(new Set<string>());

  /** Fire-and-forget Cloudinary delete — never throws. */
  const deleteCover = (url: string) => {
    const publicId = extractCloudinaryPublicId(url);
    if (publicId) mediaApi.delete(publicId).catch(() => {});
  };

  useEffect(() => { params.then(({ id }) => setSlug(id)); }, [params]);
  useEffect(() => { if (!isLoading && !user) router.replace('/login'); }, [user, isLoading, router]);
  useEffect(() => {
    if (!slug) return;
    setFetchLoading(true);
    postsApi.getBySlug(slug)
      .then(r => {
        const post: PostDetail = r.data.data;
        setPostId(post.id);
        setTitle(post.title ?? '');
        setContent(post.content ?? '');
        setExcerpt(post.excerpt ?? '');
        setCoverImageUrl(post.coverImageUrl ?? '');
        setSelectedCategories(post.categories.map(c => c.id));
        setTags(post.tags.map(t => t.name));
        setCurrentStatus(post.status ?? 'DRAFT');
      })
      .catch(() => { toast.error('Post not found or you do not have permission to edit it.'); router.replace('/profile'); })
      .finally(() => setFetchLoading(false));
  }, [slug, router]);

  const savePost = useCallback(async (publish: boolean) => {
    if (!title.trim() || !content.trim() || content === '<p></p>') {
      toast.error('Title and content are required.');
      return;
    }
    publish ? setPublishing(true) : setSaving(true);
    try {
      await postsApi.update(postId, {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || undefined,
        coverImageUrl: coverImageUrl || undefined,
        categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
        tagNames: tags.length > 0 ? tags : undefined,
      });
      if (publish && currentStatus !== 'PUBLISHED') await postsApi.publish(postId);
      router.push('/profile');
    } catch { toast.error('Failed to save post. Please try again.'); }
    finally { setSaving(false); setPublishing(false); }
  }, [title, content, excerpt, coverImageUrl, selectedCategories, tags, postId, currentStatus, router, toast]);

  // Ctrl+S / Cmd+S → save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); savePost(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [savePost]);

  const handleCoverChange = (url: string) => {
    // Only delete if it was uploaded this session — never the server original
    if (!url && coverImageUrl && sessionUploadsRef.current.has(coverImageUrl)) {
      deleteCover(coverImageUrl);
      sessionUploadsRef.current.delete(coverImageUrl);
    }
    setCoverImageUrl(url);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const previousUrl = coverImageUrl; // capture before async upload
    setUploadingCover(true);
    try {
      const newUrl = await mediaApi.upload(file);
      sessionUploadsRef.current.add(newUrl);
      setCoverImageUrl(newUrl);
      // Only delete the previous cover if it was uploaded this session
      if (previousUrl && sessionUploadsRef.current.has(previousUrl)) {
        deleteCover(previousUrl);
        sessionUploadsRef.current.delete(previousUrl);
      }
    }
    catch { toast.error('Failed to upload cover image.'); }
    finally { setUploadingCover(false); }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 10) setTags([...tags, t]);
    setTagInput('');
  };

  const toggleCategory = (id: string) =>
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  if (isLoading || !user) return null;
  if (fetchLoading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );

  const sidebarProps = useMemo(() => ({
    coverImageUrl, onCoverChange: handleCoverChange,
    uploadingCover, onCoverUpload: handleCoverUpload,
    excerpt, onExcerptChange: setExcerpt,
    categories, selectedCategories, onToggleCategory: toggleCategory,
    tagInput, onTagInputChange: setTagInput,
    onAddTag: addTag, tags, onRemoveTag: (tag: string) => setTags(tags.filter(t => t !== tag)),
  }), [
    coverImageUrl, uploadingCover, excerpt, categories, selectedCategories, tagInput, tags
  ]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4 sm:mb-8 gap-2">
          <div className="shrink-0">
            <Link
              href="/profile"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">My Stories</span>
            </Link>
            <p className="text-xs text-gray-400 mt-0.5">
              Status:{' '}
              <span className={cn('font-semibold',
                currentStatus === 'PUBLISHED'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              )}>
                {currentStatus}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <span className="hidden sm:block text-xs text-gray-400">Ctrl+S to save</span>

            {/* Save Changes */}
            <button
              onClick={() => savePost(false)}
              disabled={saving || publishing}
              title="Save Changes"
              aria-label="Save Changes"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save Changes'}</span>
            </button>

            {/* Publish (only for drafts) */}
            {currentStatus !== 'PUBLISHED' && (
              <button
                onClick={() => savePost(true)}
                disabled={saving || publishing}
                title="Save & Publish"
                aria-label="Save & Publish"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">{publishing ? 'Publishing…' : 'Save & Publish'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile Write / Settings tabs (hidden on lg+) ─────────────── */}
        <div className="flex lg:hidden mb-4 rounded-xl bg-gray-100 dark:bg-gray-800/60 p-1 gap-1">
          <button
            onClick={() => setMobileTab('write')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
              mobileTab === 'write'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <PenLine className="h-4 w-4" />
            Write
          </button>
          <button
            onClick={() => setMobileTab('settings')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
              mobileTab === 'settings'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Settings2 className="h-4 w-4" />
            Settings
          </button>
        </div>

        {/* ── Content grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Editor column — hidden on mobile when Settings tab is active */}
          <div className={cn('lg:col-span-2', mobileTab === 'settings' && 'hidden lg:block')}>
            {/* Title */}
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }}
              placeholder="Title"
              rows={1}
              style={{ overflow: 'hidden' }}
              className="w-full px-0 pt-0 pb-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white bg-transparent border-none outline-none resize-none placeholder-gray-200 dark:placeholder-gray-700 border-b border-gray-100 dark:border-gray-800 mb-6"
            />

            {/* Rich text editor */}
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Tell your story…"
            />
          </div>

          {/* Sidebar — hidden on mobile when Write tab is active */}
          <div className={cn(mobileTab === 'write' && 'hidden lg:block', 'lg:pt-1')}>
            <PostEditorSidebar {...sidebarProps} />
          </div>
        </div>
      </div>
    </div>
  );
}
