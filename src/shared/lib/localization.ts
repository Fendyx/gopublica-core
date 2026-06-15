import type { MenuItem } from '@/entities/menu-item/types';

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