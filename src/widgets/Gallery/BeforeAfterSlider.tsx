'use client'

import * as React from 'react'
import Image from 'next/image';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { MoveHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BeforeAfterSliderProps {
  /** "Before" image URL (left side of the slider). */
  beforeImage?: string
  /** "After" image URL (right side of the slider). */
  afterImage?: string
  /** Card title, e.g. "Korekta lakieru i ceramika". */
  title?: string
  /** Short description shown under the title. */
  description?: string
  /** Initial position of the slider handle, in percent (0–100). Defaults to 50. */
  initialPosition?: number
  /** Optional className for the outer card. */
  className?: string
  /** Hide the title/description header. Defaults to false. */
  hideHeader?: boolean
}

// Profesjonalne zdjęcia detailingowe (Unsplash) — fallback, gdy nie podano propsów.
const DEFAULT_BEFORE =
  'https://res.cloudinary.com/dsag3lsvx/image/upload/v1784557330/Gemini_Generated_Image_4jn7o24jn7o24jn7_u90gw9.png'
const DEFAULT_AFTER =
  'https://res.cloudinary.com/dsag3lsvx/image/upload/v1785497789/Gemini_Generated_Image_uszwd7uszwd7uszw_zmnkqr.png'

const DEFAULT_TITLE = 'Korekta lakieru i powłoka ceramiczna'
const DEFAULT_DESCRIPTION =
  'Przesuń suwak, aby porównać stan lakieru przed i po zabiegu korekty oraz aplikacji powłoki ceramicznej.'

/**
 * BeforeAfterSlider
 *
 * Interaktywny widget typu "Przed i Po" dla studia detailingowego.
 * Użytkownik przeciąga pionowy separator, aby płynnie odsłaniać zdjęcie
 * "Po" na tle zdjęcia "Przed". Obsługuje mysz oraz dotyk.
 */
export default function BeforeAfterSlider({
  beforeImage = DEFAULT_BEFORE,
  afterImage = DEFAULT_AFTER,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  initialPosition = 50,
  className,
  hideHeader = false,
}: BeforeAfterSliderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [hasPointer, setHasPointer] = React.useState(false)

  // Framer Motion — płynna animacja wartości procentowej pozycji suwaka.
  const position = useMotionValue(initialPosition)
  const clipInset = useTransform(position, (v) => `inset(0 ${100 - v}% 0 0)`)
  const handleLeft = useTransform(position, (v) => `${v}%`)

  // Wykryj urządzenia z myszą (desktop) — pozwala ukryć podpowiedź dotykową.
  React.useEffect(() => {
    setHasPointer(window.matchMedia('(pointer: fine)').matches)
  }, [])

  // Zatrzymaj przeciąganie po zwolnieniu przycisku myszy gdziekolwiek.
  React.useEffect(() => {
    if (!isDragging) return
    const stop = () => setIsDragging(false)
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    window.addEventListener('touchcancel', stop)
    return () => {
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
      window.removeEventListener('touchcancel', stop)
    }
  }, [isDragging])

  const updatePosition = React.useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    const clamped = Math.min(100, Math.max(0, pct))
    // animate() daje płynne śledzenie zamiast skokowych aktualizacji.
    animate(position, clamped, { duration: 0.05, ease: 'linear' })
  }, [position])

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return
      updatePosition(e.clientX)
    },
    [isDragging, updatePosition],
  )

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Ignoruj prawy przycisk myszy.
      if (e.button === 2) return
      setIsDragging(true)
      updatePosition(e.clientX)
    },
    [updatePosition],
  )

  // Kliknięcie w dowolnym miejscu kontenera przesuwa tam suwak (UX bonus).
  const handleContainerClick = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isDragging) return
      updatePosition(e.clientX)
    },
    [isDragging, updatePosition],
  )

  return (
    <motion.div
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg',
        className,
      )}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {!hideHeader && (title || description) && (
        <div className="flex flex-col gap-1.5 p-5 sm:p-6">
          {title && (
            <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Wspólny kontener obrazów — wymusza proporcje i przycina nadmiar. */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onClick={handleContainerClick}
        className={cn(
          'relative aspect-[4/3] w-full select-none overflow-hidden',
          'cursor-ew-resize touch-none',
          isDragging && 'cursor-grabbing',
        )}
        role="slider"
        aria-label="Suwak porównania zdjęć Przed i Po"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position.get())}
      >
        {/* Warstwa PRZED (pełna szerokość, pod spodem). */}
        <div className="pointer-events-none absolute inset-0 h-full w-full">
          <Image
            src={beforeImage}
            alt="Stan lakieru przed zabiegiem"
            fill
            sizes="100vw"
            className="object-cover"
            draggable={false}
          />
        </div>

        {/* Warstwa PO (przycięta do lewej części przez clip-path). */}
        <motion.div
          style={{ clipPath: clipInset }}
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <Image
            src={afterImage}
            alt="Stan lakieru po zabiegu"
            fill
            sizes="100vw"
            className="object-cover"
            draggable={false}
          />
        </motion.div>

        {/* Etykieta "Przed" — prawy górny róg. */}
        <span
          className={cn(
            'pointer-events-none absolute right-3 top-3 z-20 rounded-full px-3 py-1',
            'bg-background/80 text-foreground text-xs font-semibold uppercase tracking-wider',
            'backdrop-blur-md border border-border/60 shadow-sm',
          )}
        >
          Przed
        </span>

        {/* Etykieta "Po" — lewy górny róg. */}
        <span
          className={cn(
            'pointer-events-none absolute left-3 top-3 z-20 rounded-full px-3 py-1',
            'bg-background/80 text-foreground text-xs font-semibold uppercase tracking-wider',
            'backdrop-blur-md border border-border/60 shadow-sm',
          )}
        >
          Po
        </span>

        {/* Pionowy separator z uchwytem. */}
        <motion.div
          style={{ left: handleLeft }}
          className={cn(
            'absolute top-0 z-10 h-full w-0.5 -translate-x-1/2',
            'bg-background/90 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]',
          )}
        >
          {/* Uchwyt na środku — ikona MoveHorizontal w szklanym kółku. */}
          <div
            className={cn(
              'absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center',
              'rounded-full border border-border/60 bg-background/80 text-foreground',
              'backdrop-blur-md shadow-lg transition-transform duration-200',
              'group-hover:scale-105',
              isDragging && 'scale-110',
            )}
          >
            <MoveHorizontal className="h-5 w-5" strokeWidth={2.25} />
          </div>

          {/* Subtelne rozjaśnienie krawędzi separatora. */}
          <div className="absolute inset-y-0 -left-px w-0.5 bg-gradient-to-b from-transparent via-foreground/10 to-transparent" />
        </motion.div>

        {/* Podpowiedź dla desktopu — znika po pierwszym przeciągnięciu. */}
        {hasPointer && !isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20',
              'rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground',
              'backdrop-blur-md border border-border/60',
            )}
          >
            Przeciągnij, aby porównać
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
