'use client';
import { useEffect, useState } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Megaphone,
  AlertTriangle,
  Info,
  Zap,
  Mail,
  Clock,
  ChevronRight,
  QrCode,
  SmartphoneNfc,
  CheckCircle,
} from 'lucide-react';

type NewsType = 'info' | 'marketing' | 'alert';

interface NewsPost {
  _id: string;
  type: NewsType;
  title: string;
  content: string;
  createdAt: string;
  expiresAt?: string | null;
}

const TYPE_CONFIG: Record<NewsType, {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ElementType;
  label: string;
}> = {
  info: {
    variant: 'secondary',
    icon: Info,
    label: 'Info',
  },
  marketing: {
    variant: 'default',
    icon: Megaphone,
    label: 'Update',
  },
  alert: {
    variant: 'destructive',
    icon: AlertTriangle,
    label: 'Alert',
  },
};

const PROMO_FEATURES = [
  'QR-Code-Menü für jeden Tisch',
  'NFC-Schilder — ein Tippen, und das Menü öffnet sich sofort',
  'Druck und Lieferung direkt an Ihre Adresse',
  'Sie müssen nichts weiter tun — einfach auf dem Tisch platzieren',
];

function BusinessHelpSection() {
  return (
    <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-blue-50/30 dark:from-zinc-900 dark:to-blue-950/20">
      <div className="h-1.5 bg-primary" />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">
        <div className="p-6 md:p-7">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="destructive" className="text-[10px] tracking-widest uppercase px-2 py-0">
              Neues Angebot
            </Badge>
            <QrCode className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold leading-snug mb-2">
            QR-Codes und NFC-Schilder für Ihr Restaurant
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed mb-4">
            Wir produzieren und liefern personalisierte Schilder für jeden Tisch in Ihrem
            Lokal. Gäste können das Menü mit einem einzigen Fingertipp oder Scan öffnen – ohne
            Apps und ohne die manuelle Eingabe einer Adresse.
          </CardDescription>
          <ul className="space-y-2 mb-5">
            {PROMO_FEATURES.map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                {text}
              </li>
            ))}
          </ul>
          <a
            href="mailto:hello@example.com?subject=Bestellung von QR-/NFC-Schildern für das Restaurant"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <SmartphoneNfc className="w-4 h-4" />
            Schilder bestellen
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
        <div className="flex items-center justify-center bg-muted/50 p-5 md:border-l border-t md:border-t-0 border-border">
          <img
            src="https://s.alicdn.com/@sc04/kf/H2df321f633dd4fa7859dd19cfc0f065eY.png?avif=close&webp=close"
            alt="QR- und NFC-Schilder für das Restaurant"
            className="w-full max-w-[180px] object-contain rounded-lg"
          />
        </div>
      </div>
    </Card>
  );
}

export default function GopublicaPage() {
  const t = useTranslations('admin.gopublicaPage');
  const tenant = useTenant();
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) {
      window.location.href = '/admin/login';
    } else {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!token || !tenant?.tenantId) return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/saas/news?tenantId=${tenant.tenantId}&tariff=basic`
    )
      .then((res) => res.json())
      .then((data) => setNews(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, tenant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-12">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground/30 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <BusinessHelpSection />

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
        </div>

        {news.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Zap className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">{t('empty')}</p>
              <p className="text-xs text-muted-foreground/70">{t('emptyDesc')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {news.map((item) => {
              const cfg = TYPE_CONFIG[item.type];
              const Icon = cfg.icon;
              return (
                <Card key={item._id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <div className={`h-1.5 ${item.type === 'alert' ? 'bg-destructive' : item.type === 'marketing' ? 'bg-primary' : 'bg-secondary'}`} />
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={cfg.variant} className="text-[10px] tracking-widest uppercase gap-1">
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                      <h3 className="flex-1 min-w-0 text-sm font-semibold leading-snug truncate">
                        {item.title}
                      </h3>
                      <time className="shrink-0 text-xs text-muted-foreground ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {item.content}
                    </p>
                    {item.expiresAt && (
                      <>
                        <Separator className="my-3" />
                        <p className="text-xs text-muted-foreground/80 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t('expires')}{' '}
                          {new Date(item.expiresAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}