'use client';
import { useTranslations } from 'next-intl';
import { SectionBackground, BackgroundType } from '@/entities/branch-section/types';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BackgroundSettingsProps {
  /** Current background settings */
  background?: SectionBackground;
  /** Callback when background settings change */
  onChange: (background: SectionBackground | undefined) => void;
}

const GRADIENT_DIRECTIONS = [
  { value: 'to-r', label: '→ Right' },
  { value: 'to-br', label: '↘ Bottom-Right' },
  { value: 'to-b', label: '↓ Bottom' },
  { value: 'to-bl', label: '↙ Bottom-Left' },
  { value: 'to-l', label: '← Left' },
] as const;

/**
 * Admin UI for configuring section background.
 *
 * Supports: none, solid color, gradient (2 colors + direction),
 * image (Cloudinary upload), video (Cloudinary upload).
 * Includes overlay controls (opacity slider + color picker).
 */
export default function BackgroundSettings({ background, onChange }: BackgroundSettingsProps) {
  const t = useTranslations('admin.sectionForm');

  const bgType: BackgroundType = background?.type || 'none';

  const updateBg = (patch: Partial<SectionBackground>) => {
    onChange({ ...background, ...patch, type: bgType } as SectionBackground);
  };

  const handleTypeChange = (newType: BackgroundType) => {
    if (newType === 'none') {
      onChange(undefined);
    } else {
      onChange({
        type: newType,
        color: background?.color,
        gradient: background?.gradient,
        imageUrl: background?.imageUrl,
        videoUrl: background?.videoUrl,
        mediaFit: background?.mediaFit,
        overlayOpacity: background?.overlayOpacity,
        overlayColor: background?.overlayColor,
      });
    }
  };

  // Cloudinary uploaders for image and video backgrounds
  const { openWidget: openBgImageUpload } = useCloudinaryUpload({
    resourceType: 'image',
    onSuccess: (url) => updateBg({ imageUrl: url }),
  });

  const { openWidget: openBgVideoUpload } = useCloudinaryUpload({
    resourceType: 'video',
    onSuccess: (url) => updateBg({ videoUrl: url }),
  });

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
      <Label className="text-sm font-semibold">{t('sectionBackground')}</Label>

      {/* Background Type Selector */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t('bgType')}</Label>
        <Select value={bgType} onValueChange={(val) => handleTypeChange(val as BackgroundType)}>
          <SelectTrigger>
            <SelectValue placeholder={t('bgTypeNone')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('bgTypeNone')}</SelectItem>
            <SelectItem value="color">{t('bgTypeColor')}</SelectItem>
            <SelectItem value="gradient">{t('bgTypeGradient')}</SelectItem>
            <SelectItem value="image">{t('bgTypeImage')}</SelectItem>
            <SelectItem value="video">{t('bgTypeVideo')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ─── Color Picker ─── */}
      {bgType === 'color' && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('bgColor')}</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={background?.color || '#ffffff'}
              onChange={(e) => updateBg({ color: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded border border-border"
            />
            <Input
              value={background?.color || '#ffffff'}
              onChange={(e) => updateBg({ color: e.target.value })}
              placeholder="#ffffff"
              className="font-mono"
            />
          </div>
        </div>
      )}

      {/* ─── Gradient Controls ─── */}
      {bgType === 'gradient' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* From Color */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('gradientFrom')}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={background?.gradient?.from || '#ff0000'}
                  onChange={(e) =>
                    updateBg({
                      gradient: {
                        from: e.target.value,
                        to: background?.gradient?.to || '#0000ff',
                        direction: background?.gradient?.direction || 'to-r',
                      },
                    })
                  }
                  className="h-8 w-10 cursor-pointer rounded border border-border"
                />
                <Input
                  value={background?.gradient?.from || '#ff0000'}
                  onChange={(e) =>
                    updateBg({
                      gradient: {
                        from: e.target.value,
                        to: background?.gradient?.to || '#0000ff',
                        direction: background?.gradient?.direction || 'to-r',
                      },
                    })
                  }
                  className="font-mono text-xs"
                />
              </div>
            </div>
            {/* To Color */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('gradientTo')}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={background?.gradient?.to || '#0000ff'}
                  onChange={(e) =>
                    updateBg({
                      gradient: {
                        from: background?.gradient?.from || '#ff0000',
                        to: e.target.value,
                        direction: background?.gradient?.direction || 'to-r',
                      },
                    })
                  }
                  className="h-8 w-10 cursor-pointer rounded border border-border"
                />
                <Input
                  value={background?.gradient?.to || '#0000ff'}
                  onChange={(e) =>
                    updateBg({
                      gradient: {
                        from: background?.gradient?.from || '#ff0000',
                        to: e.target.value,
                        direction: background?.gradient?.direction || 'to-r',
                      },
                    })
                  }
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>
          {/* Gradient Direction */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('gradientDirection')}</Label>
            <Select
              value={background?.gradient?.direction || 'to-r'}
              onValueChange={(val) =>
                updateBg({
                  gradient: {
                    from: background?.gradient?.from || '#ff0000',
                    to: background?.gradient?.to || '#0000ff',
                    direction: val as any,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADIENT_DIRECTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Gradient Preview */}
          <div
            className="h-12 rounded-md border border-border"
            style={{
              backgroundImage: `linear-gradient(${gradientDirMap[background?.gradient?.direction || 'to-r']}, ${background?.gradient?.from || '#ff0000'}, ${background?.gradient?.to || '#0000ff'})`,
            }}
          />
        </div>
      )}

      {/* ─── Image Upload ─── */}
      {bgType === 'image' && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('bgImage')}</Label>
          {background?.imageUrl && (
            <div className="relative h-24 rounded-md overflow-hidden border border-border">
              <img
                src={background.imageUrl}
                alt="Background"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openBgImageUpload}>
              {background?.imageUrl ? t('bgReplaceImage') : t('upload')}
            </Button>
            {background?.imageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => updateBg({ imageUrl: undefined })}
              >
                {t('bgRemoveImage')}
              </Button>
            )}
          </div>
          {/* Media fit */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('bgMediaFit')}</Label>
            <Select
              value={background?.mediaFit || 'cover'}
              onValueChange={(val) => updateBg({ mediaFit: val as 'cover' | 'contain' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">{t('bgMediaFitCover')}</SelectItem>
                <SelectItem value="contain">{t('bgMediaFitContain')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ─── Video Upload ─── */}
      {bgType === 'video' && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('bgVideo')}</Label>
          {background?.videoUrl && (
            <div className="relative h-24 rounded-md overflow-hidden border border-border">
              <video
                src={background.videoUrl}
                className="w-full h-full object-cover"
                muted
                autoPlay
                loop
                playsInline
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openBgVideoUpload}>
              {background?.videoUrl ? t('bgReplaceVideo') : t('upload')}
            </Button>
            {background?.videoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => updateBg({ videoUrl: undefined })}
              >
                {t('bgRemoveVideo')}
              </Button>
            )}
          </div>
          {/* Media fit */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('bgMediaFit')}</Label>
            <Select
              value={background?.mediaFit || 'cover'}
              onValueChange={(val) => updateBg({ mediaFit: val as 'cover' | 'contain' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">{t('bgMediaFitCover')}</SelectItem>
                <SelectItem value="contain">{t('bgMediaFitContain')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ─── Overlay Controls (shown when type != 'none') ─── */}
      {bgType !== 'none' && (
        <div className="space-y-3 pt-2 border-t border-border/50">
          <Label className="text-xs text-muted-foreground">{t('bgOverlay')}</Label>

          {/* Opacity Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('bgOverlayOpacity')}</Label>
              <span className="text-xs text-muted-foreground font-mono">
                {background?.overlayOpacity ?? 0}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={background?.overlayOpacity ?? 0}
              onChange={(e) => updateBg({ overlayOpacity: Number(e.target.value) })}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Overlay Color */}
          <div className="space-y-1">
            <Label className="text-xs">{t('bgOverlayColor')}</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={background?.overlayColor || '#000000'}
                onChange={(e) => updateBg({ overlayColor: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-border"
              />
              <Input
                value={background?.overlayColor || '#000000'}
                onChange={(e) => updateBg({ overlayColor: e.target.value })}
                placeholder="#000000"
                className="font-mono text-xs w-28"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Gradient direction enum → CSS value (for preview) */
const gradientDirMap: Record<string, string> = {
  'to-r': 'to right',
  'to-br': 'to bottom right',
  'to-b': 'to bottom',
  'to-bl': 'to bottom left',
  'to-l': 'to left',
};
