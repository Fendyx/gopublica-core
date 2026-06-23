// src/app/[tenantDomain]/[locale]/menu/page.tsx
import { redirect } from 'next/navigation';

export default function MenuRedirect({
  params,
}: {
  params: { tenantDomain: string; locale: string };
}) {
  // Мягко перенаправляем на новый универсальный роут
  redirect(`/${params.locale}/catalog`);
}