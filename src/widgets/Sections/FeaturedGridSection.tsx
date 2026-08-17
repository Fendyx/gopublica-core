'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BranchSection, FeaturedGridSettings } from '@/entities/branch-section/types';

interface FeaturedGridSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
}

export default function FeaturedGridSection({ section, locale, tenantDomain }: FeaturedGridSectionProps) {
  const settings = section.settings as FeaturedGridSettings;
  const translations = section.translations[locale] ?? {};
  const { branchSlug } = useParams();

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(translations.title || translations.subtitle) && (
          <div className="text-center mb-8">
            {translations.title && (
              <h2 className="text-3xl font-bold mb-2">{translations.title}</h2>
            )}
            {translations.subtitle && (
              <p className="text-gray-600">{translations.subtitle}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {settings.items.map((item) => {
            const card = (
              <div className="border border-border rounded-xl bg-surface-card p-6 flex items-center justify-center text-center shadow-sm transition-transform duration-200 hover:scale-105 hover:shadow-md cursor-pointer">
                <span className="text-lg font-semibold text-text-primary">
                  {capitalize(item)}
                </span>
              </div>
            );

            if (settings.displayType === 'categories') {
              return (
                <Link
                  key={item}
                  href={`/${locale}/${branchSlug}/catalog#${item}`}
                  className="block"
                >
                  {card}
                </Link>
              );
            }

            return (
              <Link
                key={item}
                href={`/${locale}/${branchSlug}/catalog/${item}`}
                className="block"
              >
                {card}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/${branchSlug}/catalog`}
            className="inline-block px-8 py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}
