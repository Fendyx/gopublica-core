import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { headers } from 'next/headers';
import LayoutWrapper from '@/shared/ui/LayoutWrapper';
import { BranchProvider } from '@/entities/branch/BranchContext';
import { TenantProvider } from '@/entities/tenant/TenantContext';
import { ThemeProvider } from '@/shared/ui/ThemeProvider';
import { Inter, Playfair_Display, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { TrackVisit } from '@/shared/ui/TrackVisit';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
});

async function getTenantByDomain(domain: string) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings/by-domain?domain=${domain}`;
  try {
    const res = await fetch(url, { next: { revalidate: 10 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const domain = headersList.get('host') ?? '';
  const tenant = await getTenantByDomain(domain);
  const messages = await getMessages();
  const tenantId = tenant?.tenantId ?? '';
  const primary = tenant?.theme?.primary ?? '#ff0505';
  const accent = tenant?.theme?.accent ?? '#F1A208';

  const radiusMap: Record<string, string> = {
    none: '0px',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.625rem',
    xl: '1rem',
    '2xl': '1.5rem'
  };
  const tenantRadius = radiusMap[tenant?.theme?.radius || 'lg'] || radiusMap['lg'];
  const pageBgColor = tenant?.theme?.pageBgColor || '';

  return (
    <html
      lang="en"
      className={cn(inter.variable, playfair.variable, "font-sans", geist.variable)}
      style={{
        '--tenant-primary': primary,
        '--tenant-accent': accent,
        '--radius': tenantRadius,
        '--page-bg-color': pageBgColor,   // сохраняем для возможного использования в других элементах
      } as React.CSSProperties}
    >
      <body style={{ backgroundColor: pageBgColor || undefined }}>
        <TrackVisit tenantId={tenantId} />
        <ThemeProvider defaultTheme="light">
          <NextIntlClientProvider messages={messages}>
            <TenantProvider tenantId={tenantId}>
              <BranchProvider tenantId={tenantId}>
                <LayoutWrapper>{children}</LayoutWrapper>
              </BranchProvider>
            </TenantProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}