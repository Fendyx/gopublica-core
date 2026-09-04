'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getLabelForLocale } from '@/shared/lib/locales';

interface TranslatableInputProps {
  /** Current translations keyed by locale code, e.g. `{ en: 'Hello', pl: 'Cześć' }` */
  value: Record<string, string>;
  /** Called with the full updated translations object on every change */
  onChange: (translations: Record<string, string>) => void;
  /** Locales to render tabs for (typically `tenant.activeLocales`) */
  activeLocales: string[];
  /** The primary / fallback locale code (tab shown as "Base (XX)") */
  defaultLocale: string;
  /** Field label shown above the tabs */
  label: string;
  /** Render as `<input>` (default) or `<textarea>` */
  type?: 'input' | 'textarea';
  /** Placeholder text for the input/textarea */
  placeholder?: string;
  /** Disable all inputs */
  disabled?: boolean;
  /** Optional className on the outer wrapper */
  className?: string;
}

/**
 * A single translatable field with locale tabs.
 *
 * Renders one tab per active locale. The defaultLocale tab is labeled
 * "Base (XX)" and the other tabs show the locale label.
 *
 * Usage:
 * ```tsx
 * <TranslatableInput
 *   value={translations}
 *   onChange={setTranslations}
 *   activeLocales={tenant.activeLocales}
 *   defaultLocale={tenant.defaultLocale}
 *   label="Title"
 * />
 * ```
 */
export function TranslatableInput({
  value,
  onChange,
  activeLocales,
  defaultLocale,
  label,
  type = 'input',
  placeholder = '',
  disabled = false,
  className = '',
}: TranslatableInputProps) {
  const [currentLang, setCurrentLang] = useState<string>(defaultLocale);

  const handleChange = (locale: string, newValue: string) => {
    onChange({ ...value, [locale]: newValue });
  };

  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {/* Locale tabs */}
      <div className="flex gap-1 mb-2">
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
      {/* Input for the active locale */}
      <InputComponent
        value={value[currentLang] ?? ''}
        onChange={(e) => handleChange(currentLang, e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
