'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { GripVertical, Trash2, Plus, Save, Languages } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  labelI18n?: Record<string, string>;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio';
  required: boolean;
  options?: string[];
  optionsI18n?: Record<string, string[]>;
  placeholder?: string;
  placeholderI18n?: Record<string, string>;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  order: number;
}

interface JobSettings {
  fields: FormField[];
  title: string;
  titleI18n?: Record<string, string>;
  description: string;
  descriptionI18n?: Record<string, string>;
  submitButtonText: string;
  submitButtonTextI18n?: Record<string, string>;
  successMessage: string;
  successMessageI18n?: Record<string, string>;
  notificationEmail: string;
  isActive: boolean;
}

const SUPPORTED_LOCALES = [
  { code: 'base', label: 'Основной (EN)' },
  { code: 'pl', label: 'Polski (PL)' },
  { code: 'de', label: 'Deutsch (DE)' }
];

// Компонент для одного поля (сортировка)
function SortableFieldItem({
  field,
  index,
  updateField,
  removeField,
  currentLang,
  t, // Прокидываем переводчик
}: {
  field: FormField;
  index: number;
  updateField: (index: number, key: keyof FormField, value: any) => void;
  removeField: (index: number) => void;
  currentLang: string;
  t: any;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getLabelValue = () => {
    if (currentLang === 'base') return field.label || '';
    return field.labelI18n?.[currentLang] || '';
  };

  const getPlaceholderValue = () => {
    if (currentLang === 'base') return field.placeholder || '';
    return field.placeholderI18n?.[currentLang] || '';
  };

  const getOptionsValue = () => {
    if (currentLang === 'base') return field.options?.join(', ') || '';
    return field.optionsI18n?.[currentLang]?.join(', ') || '';
  };

  // Динамические переводы типов полей
  const fieldTypes = [
    { value: 'text', label: t('fieldTypes.text') },
    { value: 'email', label: t('fieldTypes.email') },
    { value: 'tel', label: t('fieldTypes.tel') },
    { value: 'textarea', label: t('fieldTypes.textarea') },
    { value: 'select', label: t('fieldTypes.select') },
    { value: 'radio', label: t('fieldTypes.radio') },
    { value: 'checkbox', label: t('fieldTypes.checkbox') },
    { value: 'file', label: t('fieldTypes.file') },
  ];

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
      <div className="flex items-start gap-2">
        <div {...listeners} className="mt-2.5 cursor-grab shrink-0">
          <GripVertical className="w-5 h-5 text-muted-foreground hover:text-gray-600 transition" />
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-gray-500">
              {t('fieldLabel')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}
            </Label>
            <Input
              value={getLabelValue()}
              onChange={(e) => updateField(index, 'label', e.target.value)}
              placeholder={currentLang === 'base' ? "Field name" : t('defaults.placeholderText')}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-xs font-semibold text-gray-500">{t('fieldType')}</Label>
            <Select
              value={field.type}
              onValueChange={(val) => updateField(index, 'type', val as any)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {field.type !== 'file' && field.type !== 'checkbox' && (
            <div>
              <Label className="text-xs font-semibold text-gray-500">
                {t('fieldPlaceholder')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}
              </Label>
              <Input
                value={getPlaceholderValue()}
                onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                placeholder={currentLang === 'base' ? "Input placeholder" : t('defaults.placeholderInput')}
                className="mt-1"
              />
            </div>
          )}
          
          <div className="flex items-center gap-3 pt-4">
            <Switch
              id={`req-${field.id}`}
              checked={field.required}
              onCheckedChange={(checked) => updateField(index, 'required', checked)}
            />
            <Label htmlFor={`req-${field.id}`} className="cursor-pointer">{t('requiredField')}</Label>
          </div>
          
          {(field.type === 'select' || field.type === 'radio') && (
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold text-gray-500">
                {t('optionsComma')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}
              </Label>
              <Input
                value={getOptionsValue()}
                onChange={(e) => {
                  const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  updateField(index, 'options', opts);
                }}
                placeholder={currentLang === 'base' ? "Option 1, Option 2" : t('defaults.placeholderOptions')}
                className="mt-1"
              />
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 mt-1 rounded-lg"
          onClick={() => removeField(index)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function JobSettingsPage() {
  const router = useRouter();
  const tAdmin = useTranslations('admin');
  const t = useTranslations('admin.jobsSettings');
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<JobSettings | null>(null);
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');
  const [currentLang, setCurrentLang] = useState('base');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fieldTypes = [
    { value: 'text', label: t('fieldTypes.text') },
    { value: 'email', label: t('fieldTypes.email') },
    { value: 'tel', label: t('fieldTypes.tel') },
    { value: 'textarea', label: t('fieldTypes.textarea') },
    { value: 'select', label: t('fieldTypes.select') },
    { value: 'radio', label: t('fieldTypes.radio') },
    { value: 'checkbox', label: t('fieldTypes.checkbox') },
    { value: 'file', label: t('fieldTypes.file') },
  ];

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) {
      router.push('/admin/login');
    } else {
      setToken(savedToken);
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/jobs/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !settings || active.id === over.id) return;

    const oldIndex = settings.fields.findIndex((f) => f.id === active.id);
    const newIndex = settings.fields.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newFields = arrayMove(settings.fields, oldIndex, newIndex);
    const reordered = newFields.map((item, idx) => ({ ...item, order: idx }));
    setSettings({ ...settings, fields: reordered });
  };

  const addField = () => {
    if (!settings) return;
    const newId = `field_${Date.now()}`;
    
    const newField: FormField = {
      id: newId,
      label: currentLang === 'base' ? 'New Field' : '',
      labelI18n: currentLang !== 'base' ? { [currentLang]: t('defaults.newField') } : {},
      type: newFieldType,
      required: false,
      options: newFieldType === 'select' || newFieldType === 'radio' ? ['Option 1'] : undefined,
      optionsI18n: currentLang !== 'base' ? { [currentLang]: [t('defaults.option1')] } : {},
      placeholder: '',
      placeholderI18n: {},
      order: settings.fields.length,
    };
    
    setSettings({
      ...settings,
      fields: [...settings.fields, newField],
    });
  };

  const removeField = (index: number) => {
    if (!settings) return;
    const newFields = [...settings.fields];
    newFields.splice(index, 1);
    const reordered = newFields.map((item, idx) => ({ ...item, order: idx }));
    setSettings({ ...settings, fields: reordered });
  };

  const updateField = (index: number, key: keyof FormField, value: any) => {
    if (!settings) return;
    const newFields = [...settings.fields];
    
    if (currentLang === 'base') {
      newFields[index] = { ...newFields[index], [key]: value };
    } else {
      if (key === 'label' || key === 'placeholder') {
        const i18nKey = `${key}I18n` as 'labelI18n' | 'placeholderI18n';
        const currentMap = newFields[index][i18nKey] || {};
        newFields[index] = {
          ...newFields[index],
          [i18nKey]: { ...currentMap, [currentLang]: value }
        };
      } else if (key === 'options') {
        const currentMap = newFields[index].optionsI18n || {};
        newFields[index] = {
          ...newFields[index],
          optionsI18n: { ...currentMap, [currentLang]: value }
        };
      } else {
        newFields[index] = { ...newFields[index], [key]: value };
      }
    }
    setSettings({ ...settings, fields: newFields });
  };

  const updateSettings = (key: keyof JobSettings, value: any) => {
    if (!settings) return;
    
    if (currentLang === 'base') {
      setSettings({ ...settings, [key]: value });
    } else {
      if (key === 'title' || key === 'description' || key === 'submitButtonText' || key === 'successMessage') {
        const i18nKey = `${key}I18n`;
        const currentMap = (settings as any)[i18nKey] || {};
        setSettings({
          ...settings,
          [i18nKey]: { ...currentMap, [currentLang]: value }
        });
      } else {
        setSettings({ ...settings, [key]: value });
      }
    }
  };

  const getSettingsValue = (key: keyof JobSettings) => {
    if (!settings) return '';
    if (currentLang === 'base') return (settings[key] as string) || '';
    const i18nKey = `${key}I18n`;
    return (settings as any)[i18nKey]?.[currentLang] || '';
  };

  const saveSettings = async () => {
    if (!settings || !token) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/jobs/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save');
      alert(t('saveSuccess'));
    } catch (err) {
      console.error(err);
      alert(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10 font-medium text-gray-500">{tAdmin('loading')}</div>;
  if (!settings) return <div className="text-center py-10 font-medium text-red-500">Error loading settings</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="shadow-sm font-semibold">
          <Save className="w-4 h-4 mr-1.5" /> {saving ? t('saving') : t('save')}
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm text-gray-800">{t('languageLabel')}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {SUPPORTED_LOCALES.map(loc => (
              <Button
                key={loc.code}
                variant={currentLang === loc.code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentLang(loc.code)}
                className="rounded-lg text-xs font-medium"
              >
                {loc.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm rounded-xl">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="isActive" className="text-sm font-semibold">{t('moduleStatus')}</Label>
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={settings.isActive}
                onCheckedChange={(checked) => updateSettings('isActive', checked)}
              />
              <span className="text-sm font-medium text-gray-700">
                {settings.isActive ? t('moduleEnabled') : t('moduleDisabled')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('moduleStatusDesc')}
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t('formTitle')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}
            </Label>
            <Input
              id="title"
              value={getSettingsValue('title')}
              onChange={(e) => updateSettings('title', e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t('formDescription')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}
            </Label>
            <Textarea
              id="description"
              value={getSettingsValue('description')}
              onChange={(e) => updateSettings('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="submitButtonText" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t('submitText')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}
            </Label>
            <Input
              id="submitButtonText"
              value={getSettingsValue('submitButtonText')}
              onChange={(e) => updateSettings('submitButtonText', e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="successMessage" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t('successText')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}
            </Label>
            <Input
              id="successMessage"
              value={getSettingsValue('successMessage')}
              onChange={(e) => updateSettings('successMessage', e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="notificationEmail" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t('notificationEmail')}
            </Label>
            <Input
              id="notificationEmail"
              type="email"
              value={settings.notificationEmail || ''}
              onChange={(e) => updateSettings('notificationEmail', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">{t('fieldBuilder')}</CardTitle>
          <CardDescription>{t('fieldBuilderDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <Select value={newFieldType} onValueChange={(val) => setNewFieldType(val as any)}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder={t('selectFieldType')} />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addField} variant="outline" size="sm" className="bg-white font-medium">
              <Plus className="w-4 h-4 mr-1 text-primary" /> {t('addField')}
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={settings.fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {settings.fields.map((field, index) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    index={index}
                    updateField={updateField}
                    removeField={removeField}
                    currentLang={currentLang}
                    t={t}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}