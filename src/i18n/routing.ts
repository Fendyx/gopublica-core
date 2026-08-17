import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['pl', 'en', 'de'],
  defaultLocale: 'pl',
  localePrefix: 'always', // ← добавь эту строку
});

export const { Link } = createNavigation(routing);