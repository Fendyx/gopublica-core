'use client';
import { useState } from 'react';

/**
 * ProductGallery — mobile-first sticky-zone gallery.
 *
 * On mobile this renders inside a `sticky top-0 h-[75vh]` container
 * managed by ProductDetail. It fills that container entirely.
 *
 * On desktop, ProductDetail renders images as a vertical stack
 * directly and does NOT use this component.
 */
export default function ProductGallery({ images }: { images: string[] }) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-[10px] tracking-widest uppercase">
          Нет фото
        </span>
      </div>
    );
  }

  const prev = () => setSelected(i => Math.max(0, i - 1));
  const next = () => setSelected(i => Math.min(images.length - 1, i + 1));

  return (
    <div className="relative w-full h-full select-none">
      {/* Main image */}
      <img
        src={images[selected]}
        alt=""
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Invisible tap zones for prev/next */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Предыдущее фото"
            className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
          />
          <button
            onClick={next}
            aria-label="Следующее фото"
            className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer"
          />
        </>
      )}

      {/* Line indicator dots */}
      {images.length > 1 && (
        <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`block h-px transition-all duration-300 bg-foreground/80 ${
                idx === selected ? 'w-6 opacity-100' : 'w-2 opacity-30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}