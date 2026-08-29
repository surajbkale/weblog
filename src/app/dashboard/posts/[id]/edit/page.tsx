'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '@/lib/api/posts';
import { categoriesApi } from '@/lib/api/categories';
import { CategoryResponse, PostDetail } from '@/types/post';
import { ArrowLeft, Send, Save, Upload, X, Loader2 } from 'lucide-react';
import { mediaApi } from '@/lib/api/media';
import { cn } from '@/lib/utils/cn';
import { RichTextEditor } from '@/components/editor/RichTextEditor';

interface Props { params: Promise<{ id: string }>; }

export default function EditPostPage({ params }: Props) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [postId, setPostId] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('DRAFT');

  useEffect(() => { params.then(({ id }) => setSlug(id)); }, [params]);
  useEffect(() => { if (!isLoading && !user) router.replace('/login'); }, [user, isLoading, router]);
  useEffect(() => {
    categoriesApi.list().then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

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
      .catch(() => { alert('Post not found or no permission.'); router.replace('/profile'); })
      .finally(() => setFetchLoading(false));
  }, [slug, router]);

  const savePost = useCallback(async (publish: boolean) => {
    if (!title.trim() || !content.trim() || content === '<p></p>') {
      alert('Title and content are required.');
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
    } catch { alert('Failed to save post. Please try again.'); }
    finally { setSaving(false); setPublishing(false); }
  }, [title, content, excerpt, coverImageUrl, selectedCategories, tags, postId, currentStatus, router]);

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); savePost(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [savePost]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingCover(true);
    try { setCoverImageUrl(await mediaApi.upload(file)); }
    catch { alert('Failed to upload cover image.'); }
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/profile" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-0.5">
              <ArrowLeft className="h-4 w-4" /> My Stories
            </Link>
            <p className="text-xs text-gray-400">
              Status: <span className={cn('font-semibold',
                currentStatus === 'PUBLISHED' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400')}>
                {currentStatus}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-400">Ctrl+S to save</span>
            <button onClick={() => savePost(false)} disabled={saving || publishing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {currentStatus !== 'PUBLISHED' && (
              <button onClick={() => savePost(true)} disabled={saving || publishing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50">
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {publishing ? 'Publishing…' : 'Save & Publish'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor column */}
          <div className="lg:col-span-2">
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
              className="w-full px-0 pt-0 pb-4 text-4xl font-extrabold text-gray-900 dark:text-white bg-transparent border-none outline-none resize-none placeholder-gray-200 dark:placeholder-gray-700 border-b border-gray-100 dark:border-gray-800 mb-6"
            />

            {/* Rich text editor */}
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Tell your story…"
            />
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:pt-1">
            {/* Cover image */}
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Cover Image</h3>
              {coverImageUrl ? (
                <div className="relative">
                  <img src={coverImageUrl} alt="Cover" className="w-full aspect-video object-cover rounded-lg" />
                  <button onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className={cn('flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed cursor-pointer transition-colors',
                  uploadingCover ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50')}>
                  {uploadingCover ? <Loader2 className="h-8 w-8 text-blue-400 animate-spin" /> : (
                    <><Upload className="h-8 w-8 text-gray-400 mb-2" /><span className="text-xs text-gray-500">Upload cover image</span></>
                  )}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploadingCover} />
                </label>
              )}
            </div>

            {/* Excerpt */}
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Excerpt</h3>
                <span className={cn('text-xs', excerpt.length > 450 ? 'text-orange-500' : 'text-gray-400')}>{excerpt.length}/500</span>
              </div>
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
                placeholder="Brief description for previews…" rows={3} maxLength={500}
                className="w-full text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors placeholder-gray-400" />
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                      className={cn('text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
                        selectedCategories.includes(cat.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600')}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tags <span className="font-normal text-gray-400 text-xs">({tags.length}/10)</span></h3>
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag, press Enter"
                className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400" />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full">
                      #{tag}
                      <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
