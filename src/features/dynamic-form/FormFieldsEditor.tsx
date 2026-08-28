'use client';

import { useState } from 'react';
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
import { FormField } from '@/entities/branch-section/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Trash2, Plus, X } from 'lucide-react';

interface FormFieldsEditorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  currentLang: string;
  t: (key: string) => string;
}

const fieldTypes = [
  { value: 'text', labelKey: 'fieldTypes.text' },
  { value: 'email', labelKey: 'fieldTypes.email' },
  { value: 'tel', labelKey: 'fieldTypes.tel' },
  { value: 'textarea', labelKey: 'fieldTypes.textarea' },
  { value: 'select', labelKey: 'fieldTypes.select' },
  { value: 'radio', labelKey: 'fieldTypes.radio' },
  { value: 'checkbox', labelKey: 'fieldTypes.checkbox' },
  { value: 'file', labelKey: 'fieldTypes.file' },
  { value: 'date', labelKey: 'Date' }
];

function SortableFieldItem({
  field,
  index,
  updateField,
  removeField,
  currentLang,
  t,
}: {
  field: FormField;
  index: number;
  updateField: (index: number, key: keyof FormField, value: any) => void;
  removeField: (index: number) => void;
  currentLang: string;
  t: (key: string) => string;
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

  // Получаем текущий массив опций
  const currentOptions = currentLang === 'base' 
    ? (field.options || []) 
    : (field.optionsI18n?.[currentLang] || []);

  const handleOptionChange = (optIndex: number, val: string) => {
    const newOpts = [...currentOptions];
    newOpts[optIndex] = val;
    updateField(index, 'options', newOpts);
  };

  const handleAddOption = () => {
    const newOpts = [...currentOptions, ''];
    updateField(index, 'options', newOpts);
  };

  const handleRemoveOption = (optIndex: number) => {
    const newOpts = currentOptions.filter((_, i) => i !== optIndex);
    updateField(index, 'options', newOpts);
  };

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
              placeholder={currentLang === 'base' ? 'Field name' : t('defaults.placeholderText')}
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
                  <SelectItem key={ft.value} value={ft.value}>
                    {ft.labelKey === 'Date' ? 'Date' : t(ft.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {field.type !== 'file' && field.type !== 'checkbox' && field.type !== 'date' && (
            <div>
              <Label className="text-xs font-semibold text-gray-500">
                {t('fieldPlaceholder')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}
              </Label>
              <Input
                value={getPlaceholderValue()}
                onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                placeholder={currentLang === 'base' ? 'Input placeholder' : t('defaults.placeholderInput')}
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

          {/* НОВЫЙ БЛОК ДЛЯ ОПЦИЙ (Радио / Селект) */}
          {(field.type === 'select' || field.type === 'radio') && (
            <div className="md:col-span-2 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
              <Label className="text-xs font-semibold text-gray-500 mb-2 block">
                Opcje wyboru {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}
              </Label>
              <div className="space-y-2">
                {currentOptions.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                      placeholder={`Opcja ${optIdx + 1}`}
                      className="h-9 bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleRemoveOption(optIdx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 h-8 text-xs font-medium bg-white"
                onClick={handleAddOption}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Dodaj opcję
              </Button>
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

export default function FormFieldsEditor({
  fields,
  onChange,
  currentLang,
  t,
}: FormFieldsEditorProps) {
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newFields = arrayMove(fields, oldIndex, newIndex);
    const reordered = newFields.map((item, idx) => ({ ...item, order: idx }));
    onChange(reordered);
  };

  const addField = () => {
    const newId = `field_${Date.now()}`;
    const newField: FormField = {
      id: newId,
      label: currentLang === 'base' ? 'New Field' : '',
      labelI18n: currentLang !== 'base' ? { [currentLang]: t('defaults.newField') } : {},
      type: newFieldType,
      required: false,
      options: newFieldType === 'select' || newFieldType === 'radio' ? ['Opcja 1'] : undefined,
      optionsI18n: currentLang !== 'base' ? { [currentLang]: [t('defaults.option1')] } : {},
      placeholder: '',
      placeholderI18n: {},
      order: fields.length,
    };
    onChange([...fields, newField]);
  };

  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    const reordered = newFields.map((item, idx) => ({ ...item, order: idx }));
    onChange(reordered);
  };

  const updateField = (index: number, key: keyof FormField, value: any) => {
    const newFields = [...fields];
    let updatedField = { ...newFields[index] };

    // 1. Обновляем значение в зависимости от текущего языка
    if (currentLang === 'base') {
      (updatedField as any)[key] = value;
    } else {
      if (key === 'label' || key === 'placeholder') {
        const i18nKey = `${key}I18n` as 'labelI18n' | 'placeholderI18n';
        updatedField[i18nKey] = { ...(updatedField[i18nKey] || {}), [currentLang]: value };
      } else if (key === 'options') {
        updatedField.optionsI18n = { ...(updatedField.optionsI18n || {}), [currentLang]: value };
      } else {
        (updatedField as any)[key] = value;
      }
    }

    // 2. БРОНЕБОЙНАЯ ЗАЩИТА: Гарантируем, что для select/radio zawsze есть массив опций
    if (updatedField.type === 'select' || updatedField.type === 'radio') {
      if (!Array.isArray(updatedField.options) || updatedField.options.length === 0) {
        updatedField.options = ['Opcja 1'];
      }
    } else {
      // Если это текст/email/и т.д., удаляем опции
      delete updatedField.options;
      delete updatedField.optionsI18n;
    }

    newFields[index] = updatedField;
    onChange(newFields);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
        <Select value={newFieldType} onValueChange={(val) => setNewFieldType(val as any)}>
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder={t('selectFieldType')} />
          </SelectTrigger>
          <SelectContent>
            {fieldTypes.map((ft) => (
              <SelectItem key={ft.value} value={ft.value}>
                {ft.labelKey === 'Date' ? 'Date' : t(ft.labelKey)}
              </SelectItem>
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
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {fields.map((field, index) => (
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
    </div>
  );
}