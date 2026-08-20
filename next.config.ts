// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    // Разрешаем загрузку картинок с ЛЮБЫХ доменов (для теста)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1024, 1200, 1600, 2048],
    minimumCacheTTL: 31536000,
  },
};

// Оборачиваем конфиг
const finalConfig = withNextIntl(nextConfig);

// ДЕБАГ: выводим в терминал то, что реально уходит в Next.js
console.log('--- NEXT.JS CONFIG CHECK ---');
console.log('Images config after next-intl:', finalConfig.images);
console.log('----------------------------');

// Explicitly type the return to catch merge issues at compile time
export default finalConfig satisfies NextConfig;