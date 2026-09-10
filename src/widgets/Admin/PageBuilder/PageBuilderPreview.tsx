'use client';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BranchSection } from '@/entities/branch-section/types';
import { sectionRegistry } from '@/widgets/Sections/registry';
import type { MenuItem } from '@/entities/menu-item/types';

interface PageBuilderPreviewProps {
  sections: BranchSection[];
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
  dynamicItemsMap?: Map<string, MenuItem[]>;
  currencySymbol?: string;
  className?: string;
}

/**
 * Live preview panel for the Page Builder.
 * Renders sections using the same SectionRenderer pipeline as the storefront,
 * allowing admins to see changes in real-time without leaving the editor.
 */
export default function PageBuilderPreview({
  sections,
  locale,
  tenantDomain,
  branchSlug,
  dynamicItemsMap = new Map(),
  currencySymbol = 'zł',
  className,
}: PageBuilderPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeSections = sections
    .filter((s) => s.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <div
      className={`flex flex-col border rounded-xl bg-background overflow-hidden transition-all ${
        isExpanded ? 'fixed inset-0 z-50' : ''
      } ${className}`}
    >
      {/* Preview header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Eye className="w-4 h-4" />
          <span>Live Preview</span>
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            {activeSections.length} section{activeSections.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Preview viewport */}
      <div
        className={`relative overflow-auto bg-white ${
          isExpanded ? 'flex-1' : 'h-[500px]'
        }`}
      >
        {/* Mobile-like viewport wrapper */}
        <div className="mx-auto max-w-[1200px]">
          {activeSections.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No sections to preview. Add a section to see it here.
            </div>
          ) : (
            <div className="divide-y">
              {activeSections.map((section) => {
                const Component = sectionRegistry[section.type];
                if (!Component) return null;
                const dynamicItems = dynamicItemsMap.get(section._id) || [];
                return (
                  <div
                    key={section._id}
                    data-section-type={section.type}
                    data-section-id={section._id}
                    className="relative group/preview"
                  >
                    {/* Section label overlay */}
                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                      <span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                        {section.type}
                      </span>
                    </div>
                    <Component
                      section={section}
                      locale={locale}
                      tenantDomain={tenantDomain}
                      branchSlug={branchSlug}
                      dynamicItems={dynamicItems}
                      currencySymbol={currencySymbol}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
