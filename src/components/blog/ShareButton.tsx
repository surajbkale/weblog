'use client';

import { Share2, Twitter, Link2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils/cn';
import { useEffect, useState } from 'react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe to access window now
  const shareUrl = mounted 
    ? (url || window.location.href) 
    : (url || '');

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  const btnClass = "w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200";

  return (
    <div className="flex items-center gap-2">
      {/* Twitter / X */}
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        aria-label="Share on Twitter"
        title="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className={btnClass}
        aria-label="Copy link"
        title="Copy link"
      >
        <Link2 className="h-4 w-4" />
      </button>

      {/* Native Share (Web Share API) */}
      <button
        onClick={handleNativeShare}
        className={btnClass}
        aria-label="Share via device"
        title="Share via device"
      >
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
}
