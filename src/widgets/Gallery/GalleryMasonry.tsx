'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GalleryItem } from '@/entities/gallery/types'

function distributeIntoColumns(images: GalleryItem[], cols: number) {
  const columns: GalleryItem[][] = Array.from({ length: cols }, () => [])
  images.forEach((img, i) => columns[i % cols].push(img))
  return columns
}

interface GalleryMasonryProps {
  images: GalleryItem[]
  title: string
  subtitle: string
}

export default function GalleryMasonry({ images, title, subtitle }: GalleryMasonryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [cols, setCols] = useState(3)

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth >= 1024) setCols(3)
      else if (window.innerWidth >= 640) setCols(2)
      else setCols(1)
    }
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [])

  const columns = useMemo(() => distributeIntoColumns(images, cols), [images, cols])

  const close = useCallback(() => setLightbox(null), [])
  const prev = useCallback(
    () => setLightbox(i => (i !== null ? (i - 1 + images.length) % images.length : null)),
    [images.length]
  )
  const next = useCallback(
    () => setLightbox(i => (i !== null ? (i + 1) % images.length : null)),
    [images.length]
  )

  useEffect(() => {
    if (lightbox === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, close, prev, next])

  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  if (!images.length) return null

  return (
    <section id="gallery" className="py-20 bg-surface-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-14">
          <span className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary mb-4">
            {subtitle}
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl text-text-primary leading-tight">
            {title}
          </h2>
          <div className="flex items-center gap-3 mt-5">
            <div className="h-px w-12 bg-border" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-70" />
            <div className="w-1 h-1 rounded-full bg-primary opacity-40" />
            <div className="h-px w-12 bg-border" />
          </div>
        </div>

        <div className="flex gap-4 md:gap-5">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-4 md:gap-5">
              {col.map(img => (
                <MasonryTile
                  key={img._id}
                  img={img}
                  onClick={() => setLightbox(images.indexOf(img))}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <Lightbox
          images={images}
          index={lightbox}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </section>
  )
}

function MasonryTile({ img, onClick }: { img: GalleryItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={img.caption || 'Открыть фото'}
      className="group relative overflow-hidden rounded-xl bg-surface-hover cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full"
    >
      <img
        src={img.image}
        alt={img.caption || 'Фото'}
        className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-400" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-9 h-9 rounded-full border border-white/80 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <IconZoom />
        </div>
        {img.caption && (
          <p className="text-white text-xs font-medium text-center px-3 leading-snug max-w-[90%] line-clamp-2 drop-shadow">
            {img.caption}
          </p>
        )}
      </div>
    </button>
  )
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryItem[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const img = images[index]
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="relative flex flex-col items-center w-full max-w-5xl px-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Закрыть" className="absolute -top-12 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
          <IconClose />
        </button>
        <p className="absolute -top-12 left-4 text-white/50 text-xs tracking-widest font-medium tabular-nums">
          {index + 1} / {images.length}
        </p>
        <div className="relative w-full flex items-center justify-center">
          <button onClick={onPrev} aria-label="Предыдущее фото" className="absolute left-0 z-10 -translate-x-2 sm:-translate-x-14 w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
            <IconChevronLeft />
          </button>
          <img key={img._id} src={img.image} alt={img.caption || 'Фото'} className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl" />
          <button onClick={onNext} aria-label="Следующее фото" className="absolute right-0 z-10 translate-x-2 sm:translate-x-14 w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
            <IconChevronRight />
          </button>
        </div>
        {img.caption && <p className="mt-4 text-white/70 text-sm text-center max-w-lg leading-relaxed">{img.caption}</p>}
        {images.length > 1 && (
          <div className="flex items-center gap-1.5 mt-5">
            {images.map((_, i) => (
              <button key={i} aria-label={`Фото ${i + 1}`}
                className={`rounded-full transition-all duration-200 ${i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function IconZoom() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
      <path d="M5 7h4M7 5v4" />
    </svg>
  )
}
function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M1 1l12 12M13 1L1 13" />
    </svg>
  )
}
function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3L5 8l5 5" />
    </svg>
  )
}
function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3l5 5-5 5" />
    </svg>
  )
}