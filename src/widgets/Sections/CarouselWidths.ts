/**
 * Static lookup maps for carousel card widths on desktop.
 *
 * IMPORTANT — Tailwind purge safety:
 * Tailwind v4 only emits classes it can statically see as string literals in
 * source. Building a class at runtime via concatenation (e.g. `'md:w-[' + n + '%]'`)
 * would be stripped at build time. These maps keep every literal class string in
 * plain sight so the scanner emits all three variants regardless of which key is
 * selected at runtime. The runtime only performs a property lookup, which is fully
 * purge-safe and requires no `safelist` configuration.
 */

/** Tailwind width classes for the `md` breakpoint, keyed by items-per-row. */
export const DESKTOP_WIDTH_CLASSES = {
  3: 'md:w-[30%]',
  4: 'md:w-[23%]',
  5: 'md:w-[18%]',
} as const;

/**
 * `<Image sizes>` attribute for the desktop breakpoint, keyed by items-per-row.
 * Keeps the rendered image width in sync with the layout width above.
 */
export const DESKTOP_SIZES = {
  3: '(max-width: 640px) 80vw, (max-width: 1024px) 60vw, 30vw',
  4: '(max-width: 640px) 80vw, (max-width: 1024px) 60vw, 23vw',
  5: '(max-width: 640px) 80vw, (max-width: 1024px) 60vw, 18vw',
} as const;

/** Default items-per-row when the setting is absent (per-component). */
export const DEFAULT_ITEMS_PER_ROW = {
  entity: 3,
  feature: 4,
} as const;