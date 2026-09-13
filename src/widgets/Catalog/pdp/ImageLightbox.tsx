'use client';
import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  productName: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Full-screen image lightbox with prev/next navigation.
 * Opens when a user clicks on a product image.
 */
export default function ImageLightbox({ images, initialIndex, productName, open, onClose }: ImageLightboxProps) {
  const [current, setCurrent] = useState(initialIndex);

  // Sync with external index changes
  useEffect(() => {
    setCurrent(initialIndex);
  }, [initialIndex]);

  const prev = useCallback(() => {
    setCurrent(i => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent(i => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, prev, next]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[110] w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-[110] text-white/70 text-sm">
        {current + 1} / {images.length}
      </div>

      {/* Prev button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 z-[110] w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 z-[110] w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Next image"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Image */}
      <div
        className="relative w-[90vw] h-[85vh] max-w-[1200px]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[current]}
          alt={`${productName} - ${current + 1}`}
          fill
          sizes="90vw"
          className="object-contain"
          priority
        />
      </div>

      {/* Thumbnail strip at bottom */}
      {images.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 z-[110] flex items-center justify-center gap-2 px-4 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
              className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 overflow-hidden bg-white/10 transition-all duration-200 ${
                idx === current
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-black/90'
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} thumb ${idx + 1}`}
                fill
                sizes="56px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
