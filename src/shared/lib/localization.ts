import type { MenuItem } from '@/entities/menu-item/types';

/** Resolve the best display name for the given locale (no primary-language check). */
export function resolveName(item: MenuItem, locale?: string): string {
  if (locale && item.translations?.[locale]?.name) {
    return item.translations[locale].name;
  }
  return item.name;
}

/** Resolve the best display description for the given locale. */
export function resolveDescription(item: MenuItem, locale?: string): string {
  if (locale && item.translations?.[locale]?.description) {
    return item.translations[locale].description;
  }
  return item.description || '';
}

export function getLocalizedName(item: MenuItem, locale: string, primaryLanguage: string): string {
  if (locale === primaryLanguage) {
    return item.name;
  }
  const translation = item.translations?.[locale]?.name;
  if (translation) {
    return `${translation} (${item.name})`;
  }
  return item.name;
}

export function getLocalizedDescription(item: MenuItem, locale: string, primaryLanguage: string): string {
  if (locale === primaryLanguage) {
    return item.description || '';
  }
  const translation = item.translations?.[locale]?.description;
  if (translation) {
    return translation;
  }
  return item.description || '';
}