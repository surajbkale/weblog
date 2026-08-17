'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '@/lib/api/posts';
import { categoriesApi } from '@/lib/api/categories';
import { CategoryResponse } from '@/types/post';
import { Navbar } from '@/components/layout/Navbar';
import { ArrowLeft, Send, Save, Upload, X, Loader2 } from 'lucide-react';
import { mediaApi } from '@/lib/api/media';
import { cn } from '@/lib/utils/cn';

export default function NewPostPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

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
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data.data)).catch(() => {});
  }, []);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await mediaApi.upload(file);
      setCoverImageUrl(url);
    } catch { alert('Failed to upload cover image.'); }
    finally { setUploadingCover(false); }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const savePost = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required.');
      return;
    }

    publish ? setPublishing(true) : setSaving(true);
    try {
      const res = await postsApi.create({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || undefined,
        coverImageUrl: coverImageUrl || undefined,
        categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
        tagNames: tags.length > 0 ? tags : undefined,
      });

      const postId = res.data.data.id;

      if (publish) {
        await postsApi.publish(postId);
        router.push(`/blog/${res.data.data.slug}`);
      } else {
        router.push('/profile');
      }
    } catch { alert('Failed to save post.'); }
    finally { setSaving(false); setPublishing(false); }
  };

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/profile" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> My Posts
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => savePost(false)} disabled={saving || publishing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button onClick={() => savePost(true)} disabled={saving || publishing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main editor ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title…"
              rows={2}
              className="w-full px-0 py-2 text-3xl font-extrabold text-gray-900 dark:text-white bg-transparent border-none outline-none resize-none placeholder-gray-300 dark:placeholder-gray-700"
            />

            {/* Write / Preview toggle */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {(['write', 'preview'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn(
                    'px-5 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
                    tab === t
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  )}>
                  {t}
                </button>
              ))}
            </div>

            {tab === 'write' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post in Markdown…&#10;&#10;## Heading&#10;&#10;**bold**, *italic*, `code`&#10;&#10;```js&#10;console.log('Hello')&#10;```"
                rows={24}
                className="w-full px-0 py-2 text-gray-800 dark:text-gray-200 bg-transparent border-none outline-none resize-none font-mono text-sm leading-7 placeholder-gray-300 dark:placeholder-gray-700"
              />
            ) : (
              <div className="prose dark:prose-invert max-w-none py-2 min-h-[400px]">
                {content ? (
                  <div className="text-gray-700 dark:text-gray-300 leading-7 whitespace-pre-wrap font-sans">
                    {content}
                  </div>
                ) : (
                  <p className="text-gray-400">Nothing to preview yet…</p>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar settings ────────────────────────────────────────── */}
          <aside className="space-y-5">

            {/* Cover image */}
            <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Cover Image</h3>
              {coverImageUrl ? (
                <div className="relative">
                  <img src={coverImageUrl} alt="Cover" className="w-full aspect-video object-cover rounded-lg" />
                  <button onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className={cn(
                  'flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed cursor-pointer transition-colors',
                  uploadingCover
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                )}>
                  {uploadingCover ? (
                    <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">Upload cover image</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploadingCover} />
                </label>
              )}
            </div>

            {/* Excerpt */}
            <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Excerpt</h3>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description for previews…"
                rows={3}
                maxLength={500}
                className="w-full text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors placeholder-gray-400"
              />
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
                        selectedCategories.includes(cat.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag, press Enter"
                  className="flex-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
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
