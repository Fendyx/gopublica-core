'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getLabelForLocale } from '@/shared/lib/locales';

/** Describes one translatable sub-field within a locale group. */
export interface TranslatableFieldDef {
  /** Key inside the per-locale object, e.g. 'title' */
  key: string;
  /** Human label shown above the input */
  label: string;
  /** Render as input (default) or textarea */
  type?: 'input' | 'textarea';
}

interface TranslatableGroupProps {
  /**
   * Nested translations, e.g.
   * ```json
   * { "en": { "title": "Hello", "subtitle": "World" },
   *   "pl": { "title": "Cześć", "subtitle": "Świat" } }
   * ```
   */
  value: Record<string, Record<string, string>>;
  /** Called with the full updated translations object on every change */
  onChange: (translations: Record<string, Record<string, string>>) => void;
  /** Locales to render (typically `tenant.activeLocales`) */
  activeLocales: string[];
  /** The primary / fallback locale (tab shown as "Base (XX)") */
  defaultLocale: string;
  /** The sub-fields to render per locale (e.g. title + subtitle) */
  fields: TranslatableFieldDef[];
  /** Disable all inputs */
  disabled?: boolean;
  /** Optional className on the outer wrapper */
  className?: string;
}

/**
 * Renders a locale-tabbed group of translation fields.
 *
 * Each locale tab shows inputs for all `fields` defined in the schema.
 * This replaces the previously hardcoded grid pattern in SectionForm.tsx.
 *
 * Usage:
 * ```tsx
 * <TranslatableGroup
 *   value={translations}
 *   onChange={setTranslations}
 *   activeLocales={tenant.activeLocales}
 *   defaultLocale={tenant.defaultLocale}
 *   fields={[
 *     { key: 'title', label: 'Title' },
 *     { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
 *   ]}
 * />
 * ```
 */
export function TranslatableGroup({
  value,
  onChange,
  activeLocales,
  defaultLocale,
  fields,
  disabled = false,
  className = '',
}: TranslatableGroupProps) {
  const [currentLang, setCurrentLang] = useState<string>(defaultLocale);

  const handleFieldChange = (locale: string, fieldKey: string, newValue: string) => {
    const localeData = value[locale] ?? {};
    onChange({
      ...value,
      [locale]: { ...localeData, [fieldKey]: newValue },
    });
  };

  const InputComponent = (type?: 'input' | 'textarea') =>
    type === 'textarea' ? Textarea : Input;

  return (
    <div className={className}>
      {/* Locale tabs */}
      <div className="flex gap-1 mb-3">
        {activeLocales.map((lang) => (
          <Button
            key={lang}
            type="button"
            variant={currentLang === lang ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentLang(lang)}
          >
            {lang === defaultLocale
              ? `Base (${lang.toUpperCase()})`
              : getLabelForLocale(lang)}
          </Button>
        ))}
      </div>

      {/* Fields for the active locale */}
      <div className="space-y-3 bg-muted p-4 rounded-lg">
        <h4 className="font-bold uppercase text-sm">{currentLang}</h4>
        {fields.map((field) => {
          const Comp = InputComponent(field.type);
          return (
            <div key={field.key} className="space-y-1">
              <Label className="text-xs">{field.label}</Label>
              <Comp
                value={value[currentLang]?.[field.key] ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  handleFieldChange(currentLang, field.key, e.target.value)
                }
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
