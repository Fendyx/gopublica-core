import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? routing.defaultLocale;
  const effectiveLocale = routing.locales.includes(locale as any) ? locale : routing.defaultLocale;

  try {
    return {
      locale: effectiveLocale,
      messages: (await import(`../../messages/${effectiveLocale}.json`)).default,
    };
  } catch {
    // Fallback to default locale if message file is missing
    return {
      locale: routing.defaultLocale,
      messages: (await import(`../../messages/${routing.defaultLocale}.json`)).default,
    };
  }
});