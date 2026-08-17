// src/app/[tenantDomain]/[locale]/menu/page.tsx
import { redirect } from 'next/navigation';

export default async function MenuRedirect({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string }>;
}) {
  const { locale } = await params;
  // Мягко перенаправляем на новый универсальный роут
  redirect(`/${locale}/catalog`);
}