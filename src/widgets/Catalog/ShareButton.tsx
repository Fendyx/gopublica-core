'use client';
import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Share2, Link, MessageCircle, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/shared/ui/Toast';

/**
 * Share button for product pages.
 *
 * Primary: uses the native Web Share API (mobile).
 * Fallback: DropdownMenu with Copy Link, Telegram, WhatsApp, Facebook.
 */
export default function ShareButton({ productName }: { productName: string }) {
  const t = useTranslations('productDetail');
  const { showToast } = useToast();

  const getShareUrl = () =>
    typeof window !== 'undefined' ? window.location.href : '';

  const handleNativeShare = useCallback(async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, url });
      } catch {
        /* user cancelled */
      }
    }
  }, [productName]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      showToast(t('linkCopied'), 'success');
    } catch {
      showToast(t('linkCopied'), 'success');
    }
  }, [t, showToast]);

  const openSocial = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(productName);

  // If native share is available, just call it directly (no dropdown needed)
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    return (
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-150"
      >
        <Share2 size={13} />
        <span className="hidden sm:inline">{t('share')}</span>
      </button>
    );
  }

  // Fallback: dropdown with social options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-150">
          <Share2 size={13} />
          <span className="hidden sm:inline">{t('share')}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
          <Link size={14} />
          {t('copyLink')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openSocial(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`)
          }
          className="gap-2 cursor-pointer"
        >
          <Send size={14} />
          {t('shareOnTelegram')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openSocial(`https://wa.me/?text=${encodedText}%20${encodedUrl}`)
          }
          className="gap-2 cursor-pointer"
        >
          <MessageCircle size={14} />
          {t('shareOnWhatsApp')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openSocial(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)
          }
          className="gap-2 cursor-pointer"
        >
          {/* Facebook f-logo icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          {t('shareOnFacebook')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
