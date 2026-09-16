// src/shared/lib/adminLocale.ts

const DEFAULT_LOCALE = 'pl';

/** Current admin panel locale (persisted in localStorage by the admin layout). */
export function getAdminLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    return localStorage.getItem('admin_locale') || DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function loadMessages(locale: string) {
  try {
    return (await import(`../../../messages/${locale}.json`)).default;
  } catch {
    // Fallback to default if the requested locale has no message file
    return (await import(`../../../messages/${DEFAULT_LOCALE}.json`)).default;
  }
}