'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/entities/tenant/TenantContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';

interface Field {
  id: string;
  label: string;
  labelI18n?: Record<string, string>;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  placeholderI18n?: Record<string, string>;
  options?: string[];
  optionsI18n?: Record<string, string[]>;
  order?: number;
}

interface JobSettings {
  title: string;
  titleI18n?: Record<string, string>;
  description: string;
  descriptionI18n?: Record<string, string>;
  submitButtonText: string;
  submitButtonTextI18n?: Record<string, string>;
  successMessage: string;
  successMessageI18n?: Record<string, string>;
  fields: Field[];
  isActive: boolean;
}

export default function PublicCareersPage() {
  const params = useParams();
  const tenant = useTenant();
  
  // Берем локаль из URL
  const locale = (params?.locale as string) || 'en';

  const [settings, setSettings] = useState<JobSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    async function fetchSettings() {
      if (!tenant?.tenantId) return;
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_BASE}/api/public/jobs/settings?tenantId=${tenant.tenantId}`, {
          headers: { 'x-tenant-id': tenant.tenantId }
        });
        if (!res.ok) throw new Error('Failed to load form configuration');
        
        // В зависимости от того, как у тебя настроен fetch
        const data = await res.json();
        console.log('Текущая локаль URL:', locale);
        console.log('Данные с бэкенда:', data); // <-- Добавь это!
        setSettings(data);
      } catch (err: any) {
        setError(err.message || 'Error loading page');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [tenant]);

  // Хелперы для вытягивания перевода
  const getLocText = (baseText: string, i18nMap?: Record<string, string>) => {
    if (i18nMap && i18nMap[locale]) return i18nMap[locale];
    return baseText; // Фолбэк на базовый язык
  };

  const getLocOptions = (baseOptions: string[] = [], i18nMap?: Record<string, string[]>) => {
    if (i18nMap && i18nMap[locale]) return i18nMap[locale];
    return baseOptions;
  };

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

    setSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('tenantId', tenant.tenantId);

      const textFields: Record<string, any> = {};
      
      settings?.fields.forEach(field => {
        if (field.type === 'file') {
          if (files[field.id]) {
            formDataToSend.append('resume', files[field.id]);
          }
        } else {
          textFields[field.id] = formValues[field.id] || '';
        }
      });

      formDataToSend.append('fields', JSON.stringify(textFields));

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/public/jobs/apply`, {
        method: 'POST',
        headers: { 'x-tenant-id': tenant.tenantId },
        body: formDataToSend,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errData.message || 'Failed to submit application');
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 rounded-xl border border-red-200 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  if (!settings || !settings.isActive) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 text-center">
        <p className="text-gray-500 font-medium">Careers page is currently unavailable.</p>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="max-w-xl mx-auto my-12">
        <Card className="border-green-100 bg-green-50/30 shadow-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <CardTitle className="text-2xl text-green-900">
              {getLocText(settings.successMessage, settings.successMessageI18n)}
            </CardTitle>
            <Button onClick={() => setSubmitSuccess(false)} variant="outline" className="mt-4">
              {locale === 'ru' ? 'Назад' : locale === 'pl' ? 'Wróć' : 'Go back'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 px-4">
      <Card className="shadow-md rounded-2xl border-gray-100">
        <CardHeader className="space-y-2 text-center pb-4 border-b border-gray-50">
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            {getLocText(settings.title, settings.titleI18n)}
          </CardTitle>
          <CardDescription className="text-gray-500 text-base">
            {getLocText(settings.description, settings.descriptionI18n)}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {settings.fields
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(field => {
                const label = getLocText(field.label, field.labelI18n);
                const placeholder = getLocText(field.placeholder || '', field.placeholderI18n);

                return (
                  <div key={field.id} className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      {label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        required={field.required}
                        placeholder={placeholder}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        value={formValues[field.id] || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        required={field.required}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        value={formValues[field.id] || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                      >
                        <option value="">{placeholder || 'Select...'}</option>
                        {getLocOptions(field.options, field.optionsI18n).map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'file' ? (
                      <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 hover:bg-gray-50/50 transition text-center cursor-pointer">
                        <input
                          type="file"
                          required={field.required && !files[field.id]}
                          accept=".pdf,.doc,.docx"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={e => handleFileChange(field.id, e.target.files?.[0] || null)}
                        />
                        <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <span className="block text-sm font-medium text-gray-600">
                          {files[field.id] ? files[field.id].name : placeholder || 'Upload file (PDF, DOC)'}
                        </span>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        required={field.required}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        value={formValues[field.id] || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}

            <Button type="submit" disabled={submitting} className="w-full py-6 text-base font-semibold rounded-xl mt-4">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {locale === 'ru' ? 'Отправка...' : locale === 'pl' ? 'Wysyłanie...' : 'Sending...'}
                </>
              ) : (
                getLocText(settings.submitButtonText, settings.submitButtonTextI18n)
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}