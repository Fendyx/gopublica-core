'use client';

import { useTranslations } from 'next-intl';
import { Navigation, MapPin, ExternalLink } from 'lucide-react';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';
import { Button } from '@/components/ui/button';
import MapEmbed from '@/components/ui/MapEmbed';

interface DirectionCardProps {
  /** Optional address override. When omitted, uses branch settings address. */
  address?: string;
}

export function DirectionCard({ address }: DirectionCardProps) {
  const t = useTranslations('article.directionCard');
  const { address: branchAddress, loading } = useBranchSettings();

  const displayAddress = address || branchAddress || '';

  if (loading) return null;

  const mapsUrl = displayAddress
    ? `https://maps.google.com/?q=${encodeURIComponent(displayAddress)}`
    : 'https://maps.google.com/';

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-background border-t p-4 shadow-lg lg:relative lg:border-none lg:shadow-none lg:p-0 lg:sticky lg:top-24">
      {/* Mobile: compact horizontal bar */}
      <div className="flex flex-row items-center justify-between gap-4 lg:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <Navigation className="w-4 h-4 text-primary shrink-0" />
          <div className="min-w-0">
            <span className="text-xs text-muted-foreground block">{t('getDirections')}</span>
            {displayAddress && (
              <span className="text-sm font-medium truncate block">{displayAddress}</span>
            )}
          </div>
        </div>
        <Button asChild className="gap-2 shrink-0">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
            {t('openMaps')}
          </a>
        </Button>
      </div>

      {/* Desktop: full card layout with map */}
      <div className="hidden lg:block bg-card border rounded-xl overflow-hidden shadow-sm">
        {/* Map embed */}
        <div className="h-48 w-full">
          <MapEmbed
            address={displayAddress}
            height="192px"
            showAddressBadge={false}
            showDirections={false}
          />
        </div>

        {/* Info + button */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">{t('getDirections')}</span>
          </div>

          {displayAddress && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{displayAddress}</span>
            </div>
          )}

          <Button asChild className="w-full gap-2 py-3 text-lg">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-5 h-5" />
              {t('openInMaps')}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
