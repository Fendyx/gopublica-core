'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

export interface ConsentCheckboxesProps {
  /** Called whenever any checkbox value changes. Consumers can use this to gate submission. */
  onChange?: (consent: ConsentState) => void
  /** Hide the optional marketing checkbox (e.g. for forms where marketing opt-in is irrelevant). */
  hideMarketing?: boolean
  /** Extra CSS class on the outer wrapper */
  className?: string
}

export interface ConsentState {
  terms: boolean
  privacy: boolean
  marketing: boolean
}

const INITIAL: ConsentState = { terms: false, privacy: false, marketing: false }

/**
 * Reusable GDPR-consent checkboxes for every public-facing form.
 *
 * Renders two mandatory checkboxes (Terms of Service + Privacy Policy)
 * and an optional marketing opt-in checkbox.  All labels are i18n-ready
 * via the `consent.*` namespace in next-intl message files.
 *
 * Usage example:
 * ```tsx
 * const [consent, setConsent] = useState<ConsentState>(INITIAL)
 *
 * <ConsentCheckboxes onChange={setConsent} />
 * <button disabled={!consent.terms || !consent.privacy}>Submit</button>
 * ```
 */
export default function ConsentCheckboxes({
  onChange,
  hideMarketing = false,
  className,
}: ConsentCheckboxesProps) {
  const t = useTranslations('consent')
  const locale = useLocale()
  const [state, setState] = useState<ConsentState>(INITIAL)

  const update = (patch: Partial<ConsentState>) => {
    const next = { ...state, ...patch }
    setState(next)
    onChange?.(next)
  }

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      {/* Terms of Service */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <Checkbox
          id="consent-terms"
          checked={state.terms}
          onCheckedChange={(checked) => update({ terms: checked === true })}
          className="mt-0.5"
        />
        <span className="text-sm text-muted-foreground leading-relaxed select-none group-hover:text-foreground transition-colors">
          {t.rich('acceptTerms', {
            termsLink: (chunks) => (
              <Link
                href={`/${locale}/regulamin`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-foreground hover:text-primary transition-colors font-medium"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>

      {/* Privacy Policy */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <Checkbox
          id="consent-privacy"
          checked={state.privacy}
          onCheckedChange={(checked) => update({ privacy: checked === true })}
          className="mt-0.5"
        />
        <span className="text-sm text-muted-foreground leading-relaxed select-none group-hover:text-foreground transition-colors">
          {t.rich('acceptPrivacy', {
            privacyLink: (chunks) => (
              <Link
                href={`/${locale}/polityka-prywatnosci`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-foreground hover:text-primary transition-colors font-medium"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>

      {/* Optional marketing opt-in */}
      {!hideMarketing && (
        <label className="flex items-start gap-3 cursor-pointer group">
          <Checkbox
            id="consent-marketing"
            checked={state.marketing}
            onCheckedChange={(checked) => update({ marketing: checked === true })}
            className="mt-0.5"
          />
          <span className="text-sm text-muted-foreground leading-relaxed select-none group-hover:text-foreground transition-colors">
            {t('acceptMarketing')}
          </span>
        </label>
      )}
    </div>
  )
}

export { INITIAL as INITIAL_CONSENT }
