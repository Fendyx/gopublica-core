// src/shared/lib/adminLocale.ts

const DEFAULT_LOCALE = 'pl';

export async function loadMessages(locale: string) {
  try {
    return (await import(`../../../messages/${locale}.json`)).default;
  } catch {
    // Fallback to default if the requested locale has no message file
    return (await import(`../../../messages/${DEFAULT_LOCALE}.json`)).default;
  }
}