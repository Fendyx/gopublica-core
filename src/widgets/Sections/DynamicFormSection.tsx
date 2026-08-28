'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
import { BranchSection, DynamicFormSettings, FormField } from '@/entities/branch-section/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';

interface DynamicFormSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
  dynamicItems?: any[];
  currencySymbol?: string;
}

function getLocText(baseText: string, i18nMap?: Record<string, string>, locale: string = 'en'): string {
  if (i18nMap && i18nMap[locale]) return i18nMap[locale];
  return baseText;
}

function getLocOptions(baseOptions: string[] = [], i18nMap?: Record<string, string[]>, locale: string = 'en'): string[] {
  if (i18nMap && i18nMap[locale]) return i18nMap[locale];
  return baseOptions;
}

export default function DynamicFormSection({ section, locale, tenantDomain }: DynamicFormSectionProps) {
  const t = useTranslations('dynamicForm');
  const tenant = useTenant();
  const settings = (section.settings || {}) as DynamicFormSettings;
  const fields = settings.fields || [];

  const title = section.translations?.[locale]?.title;
  const subtitle = section.translations?.[locale]?.subtitle;

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (fieldId: string, file: File | null) => {
    if (file) {
      setFiles(prev => ({ ...prev, [fieldId]: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.tenantId) return;

    setStatus('loading');
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('tenantId', tenant.tenantId);
      formDataToSend.append('sectionId', section._id);

      const textFields: Record<string, any> = {};

      fields.forEach(field => {
        if (field.type === 'file') {
          if (files[field.id]) {
            formDataToSend.append(field.id, files[field.id]);
          }
        } else {
          textFields[field.id] = formValues[field.id] || '';
        }
      });

      formDataToSend.append('fields', JSON.stringify(textFields));

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/public/forms/${section._id}/submit`, {
        method: 'POST',
        headers: {
          'x-tenant-id': tenant.tenantId,
          'x-tenant-host': tenantDomain,
        },
        body: formDataToSend,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errData.message || 'Failed to submit form');
      }

      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStatus('error');
    }
  };

  if (status === 'success') {
    const successMessage = getLocText(settings.successMessage || '', settings.successMessageI18n, locale) || t('successDefault');
    return (
      <section className="py-12 bg-surface-page">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-900 mb-2">{successMessage}</h3>
            <Button onClick={() => setStatus('idle')} variant="outline" className="mt-4">
              {t('back')}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!section.isActive) {
    return null;
  }

  const submitLabel = getLocText(settings.submitLabel || '', settings.submitLabelI18n, locale) || t('submitDefault');
  
  const rawSideText = getLocText(settings.sideText || '', settings.sideTextI18n, locale);
  const hasSideText = !!rawSideText && rawSideText !== '<p></p>';

  return (
    <section className="py-16 bg-surface-page">
      <div className={`mx-auto px-4 ${hasSideText ? 'max-w-6xl' : 'max-w-2xl'}`}>
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {title && <h2 className="text-3xl font-bold text-gray-900">{title}</h2>}
            {subtitle && <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
          </div>
        )}

        <div className={hasSideText ? 'grid lg:grid-cols-2 gap-12 lg:gap-16 items-start' : ''}>
          {hasSideText && (
            <div 
              className="prose prose-slate prose-p:text-gray-600 prose-headings:text-gray-900 max-w-none lg:pt-4"
              dangerouslySetInnerHTML={{ __html: rawSideText }}
            />
          )}

          <div className={hasSideText ? 'bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm' : ''}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {fields
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(field => {
                  const label = getLocText(field.label, field.labelI18n, locale);
                  const placeholder = getLocText(field.placeholder || '', field.placeholderI18n, locale);
                  const options = getLocOptions(field.options, field.optionsI18n, locale);

                  return (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">
                        {label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          required={field.required}
                          placeholder={placeholder}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          value={formValues[field.id] || ''}
                          onChange={e => handleInputChange(field.id, e.target.value)}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          required={field.required}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          value={formValues[field.id] || ''}
                          onChange={e => handleInputChange(field.id, e.target.value)}
                        >
                          <option value="">{placeholder || 'Select...'}</option>
                          {options.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'radio' ? (
                        <div className="space-y-3 pt-2">
                          {options.map((opt, oIdx) => (
                            <label key={oIdx} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name={field.id}
                                value={opt}
                                checked={formValues[field.id] === opt}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                                required={field.required && oIdx === 0}
                                className="h-4 w-4 text-primary border-gray-300 focus:ring-2 focus:ring-primary/20"
                              />
                              <span className="text-sm text-gray-700">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-start gap-3 pt-1">
                          <Checkbox
                            id={field.id}
                            checked={formValues[field.id] || false}
                            onCheckedChange={checked => handleInputChange(field.id, checked)}
                            required={field.required}
                            className="mt-0.5"
                          />
                          <label htmlFor={field.id} className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                            {placeholder || 'I agree'}
                          </label>
                        </div>
                      ) : field.type === 'file' ? (
                        <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 hover:bg-gray-50/50 transition text-center cursor-pointer">
                          <input
                            type="file"
                            required={field.required && !files[field.id]}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={e => handleFileChange(field.id, e.target.files?.[0] || null)}
                          />
                          <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <span className="block text-sm font-medium text-gray-600">
                            {files[field.id] ? files[field.id].name : placeholder || 'Upload file (PDF, DOC, Images)'}
                          </span>
                        </div>
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          required={field.required}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          value={formValues[field.id] || ''}
                          onChange={e => handleInputChange(field.id, e.target.value)}
                        />
                      ) : (
                        <input
                          type={field.type}
                          required={field.required}
                          placeholder={placeholder}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          value={formValues[field.id] || ''}
                          onChange={e => handleInputChange(field.id, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}

              <Button type="submit" disabled={status === 'loading'} className="w-full py-6 text-base font-semibold rounded-xl mt-6">
                {status === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}