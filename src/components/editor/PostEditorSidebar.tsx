'use client';

import { X, Upload, Loader2 } from 'lucide-react';
import { CategoryResponse } from '@/types/post';
import { cn } from '@/lib/utils/cn';
import Image from 'next/image';

interface Props {
  coverImageUrl: string;
  onCoverChange: (url: string) => void;
  uploadingCover: boolean;
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  excerpt: string;
  onExcerptChange: (v: string) => void;

  categories: CategoryResponse[];
  selectedCategories: string[];
  onToggleCategory: (id: string) => void;

  tagInput: string;
  onTagInputChange: (v: string) => void;
  onAddTag: () => void;
  tags: string[];
  onRemoveTag: (tag: string) => void;
}

/**
 * Shared sidebar content used in both the new-post and edit-post pages.
 * On desktop it lives in the right column; on mobile it becomes the
 * "Settings" tab content.
 */
export function PostEditorSidebar({
  coverImageUrl, onCoverChange, uploadingCover, onCoverUpload,
  excerpt, onExcerptChange,
  categories, selectedCategories, onToggleCategory,
  tagInput, onTagInputChange, onAddTag,
  tags, onRemoveTag,
}: Props) {
  return (
    <aside className="space-y-5">
      {/* Cover image */}
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Cover Image</h3>
        {coverImageUrl ? (
          <div className="relative aspect-video">
            <Image src={coverImageUrl} alt="Cover" fill className="object-cover rounded-lg" sizes="(max-width: 1024px) 100vw, 320px" />
            <button
              onClick={() => onCoverChange('')}
              className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
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
            {uploadingCover
              ? <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
              : <><Upload className="h-8 w-8 text-gray-400 mb-2" /><span className="text-xs text-gray-500">Upload cover image</span></>
            }
            <input type="file" accept="image/*" onChange={onCoverUpload} className="hidden" disabled={uploadingCover} />
          </label>
        )}
      </div>

      {/* Excerpt */}
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Excerpt</h3>
          <span className={cn('text-xs', excerpt.length > 450 ? 'text-orange-500' : 'text-gray-400')}>
            {excerpt.length}/500
          </span>
        </div>
        <textarea
          value={excerpt}
          onChange={e => onExcerptChange(e.target.value)}
          placeholder="Brief description for previews…"
          rows={3}
          maxLength={500}
          className="w-full text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors placeholder-gray-400"
        />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onToggleCategory(cat.id)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
                  selectedCategories.includes(cat.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Tags <span className="font-normal text-gray-400 text-xs">({tags.length}/10)</span>
        </h3>
        <input
          type="text"
          value={tagInput}
          onChange={e => onTagInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAddTag(); } }}
          placeholder="Add tag, press Enter"
          className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full">
                #{tag}
                <button onClick={() => onRemoveTag(tag)} className="hover:text-red-500 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
