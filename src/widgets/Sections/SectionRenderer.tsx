import { BranchSection } from '@/entities/branch-section/types';
import { sectionRegistry } from './registry';

interface SectionRendererProps {
  sections: BranchSection[];
  locale: string;
  tenantDomain: string;
}

export default function SectionRenderer({ sections, locale, tenantDomain }: SectionRendererProps) {
  const activeSections = sections
    .filter((s) => s.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {activeSections.map((section) => {
        const Component = sectionRegistry[section.type];
        return (
          <div key={section._id} data-section-type={section.type} data-section-id={section._id}>
            <Component section={section} locale={locale} tenantDomain={tenantDomain} />
          </div>
        );
      })}
    </>
  );
}
