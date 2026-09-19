// src/app/[tenantDomain]/[locale]/menu/page.tsx
import { redirect } from 'next/navigation';

export default async function MenuRedirect({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string }>;
}) {
  const { locale } = await params;
  // Redirect to tenant home page which auto-resolves the default branch
  redirect(`/${locale}`);
}