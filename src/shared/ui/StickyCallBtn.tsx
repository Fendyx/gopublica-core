'use client'
import { Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function StickyCallBtn({ phone }: { phone: string }) {
  const t = useTranslations('nav')
  return (
    <a
      href={`tel:${phone}`}
      className="fixed bottom-4 right-4 z-50 md:hidden flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg transition-opacity hover:opacity-90"
      style={{ backgroundColor: 'var(--color-primary)' }}
      aria-label={t('call')}
    >
      <Phone size={22} />
    </a>
  )
}