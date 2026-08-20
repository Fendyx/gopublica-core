'use client';

/**
 * Reusable Google Maps embed component.
 *
 * Extracted from `src/widgets/About/Contact.tsx` so it can be shared by
 * the Contact section, the Booking section split-screen layout, and any
 * future section that needs an elegant map panel.
 *
 * The iframe is shifted up by 40px and made taller so the Google Maps
 * bottom bar (branding, controls) stays hidden below the fold.
 */

interface MapEmbedProps {
  /** Address to geocode and display. Falls back to 'Poland' when empty. */
  address?: string;
  /** CSS height for the panel (default: 480px). */
  height?: string;
  /** Additional CSS classes for the outer container. */
  className?: string;
  /** Whether to show the floating address badge (default: true). */
  showAddressBadge?: boolean;
  /** Whether to show the "Get directions" pill (default: true). */
  showDirections?: boolean;
}

export default function MapEmbed({
  address,
  height = '480px',
  className = '',
  showAddressBadge = true,
  showDirections = true,
}: MapEmbedProps) {
  const mapAddress = encodeURIComponent(address || 'Poland');
  const iframeSrc = `https://maps.google.com/maps?q=${mapAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const mapsUrl = `https://maps.google.com/?q=${mapAddress}`;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-border shadow-sm bg-surface-hover ${className}`}
      style={{ minHeight: height }}
    >
      <iframe
        title="Google Maps"
        src={iframeSrc}
        width="100%"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{
          border: 0,
          position: 'absolute',
          top: '-40px',
          left: 0,
          width: '100%',
          height: 'calc(100% + 40px)',
          display: 'block',
        }}
      />

      {/* Top vignette — softens the cut */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-28 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 100%)',
        }}
      />

      {/* Bottom vignette — floats the address card */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
        }}
      />

      {/* Get Directions pill — top right */}
      {showDirections && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3.5 py-2 rounded-full shadow-md hover:shadow-lg hover:bg-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
        >
          <IconCompass />
          Get directions
        </a>
      )}

      {/* Floating address badge — bottom left */}
      {showAddressBadge && address && (
        <div className="absolute bottom-5 left-4 right-4 z-20 flex items-center gap-3 pointer-events-none">
          {/* Pin dot */}
          <div className="w-9 h-9 rounded-full bg-primary shadow-lg flex items-center justify-center shrink-0">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5z" />
              <circle cx="8" cy="6" r="1.5" />
            </svg>
          </div>
          <p className="text-sm text-white font-medium leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            {address}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Icon ─────────────────────────────────── */
function IconCompass() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path d="M10.5 5.5 9 9l-3.5 1.5L7 7l3.5-1.5z" />
    </svg>
  );
}