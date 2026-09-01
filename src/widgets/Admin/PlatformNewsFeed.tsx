'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { fetchPlatformNews } from '@/entities/platformProduct/api';
import type { PlatformNewsItem } from '@/entities/platformProduct/types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone, Info, Zap, AlertTriangle, Clock,
} from 'lucide-react';

const TYPE_CONFIG: Record<
  PlatformNewsItem['type'],
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; label: string }
> = {
  info: { variant: 'secondary', icon: Info, label: 'Info' },
  update: { variant: 'default', icon: Zap, label: 'Update' },
  announcement: { variant: 'outline', icon: Megaphone, label: 'Announcement' },
  promo: { variant: 'default', icon: Megaphone, label: 'Promo' },
};

export default function PlatformNewsFeed() {
  const locale = useLocale();
  const [news, setNews] = useState<PlatformNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformNews()
      .then(setNews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-border bg-muted/20 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Zap className="w-6 h-6 text-muted-foreground/40 mb-2" />
          <p className="text-xs font-medium text-muted-foreground">No updates yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {news.map((item) => {
        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
        const Icon = cfg.icon;
        const title = item.titleI18n?.[locale] || item.title;
        const content = item.contentI18n?.[locale] || item.content;

        return (
          <Card
            key={item._id}
            className="overflow-hidden transition-shadow hover:shadow-sm"
          >
            <div
              className={`h-1 ${
                item.type === 'promo'
                  ? 'bg-orange-500'
                  : item.type === 'announcement'
                  ? 'bg-purple-500'
                  : item.type === 'update'
                  ? 'bg-primary'
                  : 'bg-secondary'
              }`}
            />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge
                  variant={cfg.variant}
                  className="text-[9px] tracking-widest uppercase gap-1"
                >
                  <Icon className="w-2.5 h-2.5" />
                  {cfg.label}
                </Badge>
                <time className="text-[10px] text-muted-foreground ml-auto flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(item.publishedAt || item.createdAt).toLocaleDateString(locale, {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <h4 className="text-xs font-semibold leading-snug mb-1">{title}</h4>
              <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                {content}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
