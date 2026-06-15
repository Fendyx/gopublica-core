'use client'
import { useTranslations } from 'next-intl'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import { useLocale } from 'next-intl'

export default function About() {
  const t = useTranslations('about')
  const { seoDescriptionI18n, loading } = useBranchSettings()
  const locale = useLocale()
  const description = seoDescriptionI18n?.[locale] || ''

  if (loading) return <div className="py-16 text-center">Loading...</div>

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-8">{t('title')}</h2>
        <p className="text-center text-zinc-600 max-w-2xl mx-auto">{description}</p>
      </div>
    </section>
  )
}