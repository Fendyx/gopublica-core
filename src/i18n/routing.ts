import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * All locales the app CAN serve (must have a matching messages/<locale>.json).
 * To add a new locale: create the message file first, then add the code here.
 */
export const routing = defineRouting({
  locales: ['pl', 'en', 'de', 'ua'],
  defaultLocale: 'pl',
  localePrefix: 'always',
});

export const { Link } = createNavigation(routing);