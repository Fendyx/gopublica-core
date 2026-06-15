// src/shared/lib/adminLocale.ts
export async function loadMessages(locale: string) {
  const messages = await import(`../../../messages/${locale}.json`);
  return messages.default;
}