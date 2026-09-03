'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api/users';
import { mediaApi } from '@/lib/api/media';
import { formatDistanceToNow } from 'date-fns';
import {
  PenSquare, Clock,
  Upload, Save, Lock, Loader2, CheckCircle2, AlertCircle,
  FileText, Settings, ShieldCheck, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useMyPosts } from '@/hooks/useMyPosts';
import { PostActions } from '@/components/blog/PostActions';

const STATUS = {
  PUBLISHED: { dot: 'bg-green-500', label: 'Published', text: 'text-green-600 dark:text-green-400' },
  DRAFT:     { dot: 'bg-yellow-400', label: 'Draft',     text: 'text-yellow-600 dark:text-yellow-400' },
  DELETED:   { dot: 'bg-red-400',   label: 'Deleted',   text: 'text-red-500 dark:text-red-400' },
};

function Feedback({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={cn('flex items-center gap-2 text-sm rounded-xl px-4 py-2.5',
      msg.type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
    )}>
      {msg.type === 'success' ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      {msg.text}
    </div>
  );
}

// ── Stories tab ───────────────────────────────────────────────────────────────
function StoriesTab() {
  // All post-management state and mutations live in the shared hook.
  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    actionId,
    loadMore,
    handlePublish,
    handleUnpublish,
    handleDelete,
  } = useMyPosts({ pageSize: 20 });

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse flex gap-4 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  if (posts.length === 0) return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <PenSquare className="h-7 w-7 text-gray-400" />
      </div>
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">No stories yet</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Start writing your first article today.</p>
      <Link href="/profile/posts/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-full text-sm transition-colors">
        <PenSquare className="h-4 w-4" /> Write a story
      </Link>
    </div>
  );

  return (
    <div>
      {posts.map(post => {
        const s = STATUS[post.status] ?? STATUS.DRAFT;
        return (
          <article key={post.id} className="group flex gap-4 py-5 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn('flex items-center gap-1.5 text-xs font-medium', s.text)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                  {s.label}
                </span>
                <span className="text-gray-300 dark:text-gray-700">·</span>
                <span className="text-xs text-gray-400">
                  {post.publishedAt
                    ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
                    : formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1 mb-1">{post.title}</h3>
              {post.excerpt && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2 hidden sm:block">{post.excerpt}</p>
              )}
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" /> {post.readingTimeMinutes} min
                </span>
                <span className="text-xs text-gray-400">{post.viewCount} views</span>
                <span className="text-xs text-gray-400">{post.likeCount} likes</span>
                <span className="ml-auto">
                  <PostActions
                    post={post}
                    actionId={actionId}
                    editHref={`/profile/posts/${post.slug}/edit`}
                    showViewLink
                    showSpinner
                    size="sm"
                    onPublish={handlePublish}
                    onUnpublish={handleUnpublish}
                    onDelete={handleDelete}
                  />
                </span>
              </div>
            </div>
            {post.coverImageUrl && (
              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden">
                <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}
          </article>
        );
      })}

      {/* Load more */}
      {hasMore && (
        <div className="pt-6 flex justify-center">
          <button onClick={loadMore} disabled={loadingMore}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
            {loadingMore ? 'Loading…' : 'Load more stories'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const { user, checkAuth } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await mediaApi.upload(file);
      setAvatarUrl(url);
    } catch { setProfileMsg({ type: 'error', text: 'Failed to upload image.' }); }
    finally { setUploadingAvatar(false); }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);
    try {
      await usersApi.updateMe({ displayName, bio, avatarUrl });
      await checkAuth();
      setProfileMsg({ type: 'success', text: 'Profile updated!' });
    } catch { setProfileMsg({ type: 'error', text: 'Failed to update profile.' }); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    // FIX #4: proper client-side validation
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordMsg({ type: 'error', text: 'Password must contain at least one uppercase letter and one number.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setChangingPassword(true);
    setPasswordMsg(null);
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch { setPasswordMsg({ type: 'error', text: 'Failed — check that your current password is correct.' }); }
    finally { setChangingPassword(false); }
  };

  return (
    <div className="space-y-8 max-w-lg">
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Public profile</h2>
        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="relative group flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-black">
                    {(user?.displayName ?? '?').charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {uploadingAvatar ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Upload className="h-5 w-5 text-white" />}
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile photo</p>
              <p className="text-xs text-gray-400 mt-0.5">Click to upload · JPG, PNG, WebP · max 5 MB</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Display name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Tell readers about yourself…"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors placeholder-gray-400" />
          </div>
          <Feedback msg={profileMsg} />
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 text-white dark:text-gray-900 font-medium rounded-full text-sm transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      {user?.authProvider === 'LOCAL' && (
        <section className="pt-6 border-t border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Change password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { label: 'Current password', value: currentPassword, set: setCurrentPassword },
              { label: 'New password (min 8 chars, 1 uppercase, 1 number)', value: newPassword, set: setNewPassword },
              { label: 'Confirm new password', value: confirmPassword, set: setConfirmPassword },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                <input type="password" value={value} onChange={e => set(e.target.value)} required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
              </div>
            ))}
            <Feedback msg={passwordMsg} />
            <button type="submit" disabled={changingPassword}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 text-white dark:text-gray-900 font-medium rounded-full text-sm transition-colors">
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {changingPassword ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'stories',  label: 'Stories',  icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;
type Tab = typeof TABS[number]['id'];

function ProfileContent() {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get('tab') ?? 'stories') as Tab;

  const setTab = (tab: Tab) => router.push(`/profile?tab=${tab}`, { scroll: false });

  // FIX #7: show loading state + redirect guests
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  const joinedDate = user.memberSince
    ? new Date(user.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="lg:w-56 xl:w-64 flex-shrink-0">
          <div className="flex lg:flex-col items-center lg:items-start gap-4 mb-6">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 flex-shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-black">
                  {(user.displayName ?? '?').charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight truncate">{user.displayName}</p>
              <p className="text-sm text-gray-400 truncate">{user.email}</p>
              {joinedDate && <p className="text-xs text-gray-400 mt-1">Member since {joinedDate}</p>}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="font-semibold text-gray-900 dark:text-white">{user.publishedPostCount ?? 0}</span> stories published
              </p>
            </div>
          </div>

          {user.bio && (
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 hidden lg:block">{user.bio}</p>
          )}

          <nav className="hidden lg:flex flex-col gap-1 mb-6">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                  activeTab === id
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                )}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
            {user.role === 'ADMIN' && (
              <Link href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <ShieldCheck className="h-4 w-4" /> Admin panel
              </Link>
            )}
          </nav>

          <Link href="/profile/posts/new"
            className="hidden lg:flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-full text-sm transition-colors">
            <PenSquare className="h-4 w-4" /> Write a story
          </Link>
        </aside>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 lg:hidden mb-6 border-b border-gray-200 dark:border-gray-800">
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === id
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'stories' ? 'Your stories' : 'Settings'}
            </h1>
            {activeTab === 'stories' && (
              <Link href="/profile/posts/new"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-full text-sm transition-colors">
                <PenSquare className="h-4 w-4" /> Write
              </Link>
            )}
          </div>

          {activeTab === 'stories'  && <StoriesTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
