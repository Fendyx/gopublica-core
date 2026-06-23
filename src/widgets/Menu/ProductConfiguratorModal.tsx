'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { MenuItem, MenuItemModifierGroup, CartModifier } from '@/entities/menu-item/types';
import { useCartStore } from '@/shared/store/cartStore';
import { useTranslations } from 'next-intl';

interface Props {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  locale: string;
  primaryLanguage: string;
}

export default function ProductConfiguratorModal({ item, isOpen, onClose, currency, locale, primaryLanguage }: Props) {
  const t = useTranslations('configurator');
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});
  const [error, setError] = useState<string | null>(null);

  const getLocalizedName = (name: string, translations?: Record<string, { name?: string }>) => {
    if (translations && translations[locale]?.name) return translations[locale].name;
    if (translations && translations[primaryLanguage]?.name) return translations[primaryLanguage].name;
    return name;
  };

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setNotes('');
      setError(null);
      const defaults: Record<string, string | string[]> = {};
      item.modifierGroups?.forEach(group => {
        if (group.type === 'radio') {
          const defaultOpt = group.options.find(o => o.isDefault) || group.options[0];
          if (defaultOpt) defaults[group.id] = defaultOpt.id;
        } else {
          defaults[group.id] = group.options.filter(o => o.isDefault).map(o => o.id);
        }
      });
      setSelectedOptions(defaults);
    }
  }, [item]);

  if (!item) return null;

  const handleRadioChange = (groupId: string, optionId: string) => {
    setSelectedOptions(prev => ({ ...prev, [groupId]: optionId }));
  };

  const handleCheckboxChange = (groupId: string, optionId: string, checked: boolean) => {
    setSelectedOptions(prev => {
      const current = (prev[groupId] as string[]) || [];
      const group = item.modifierGroups?.find(g => g.id === groupId);
      if (checked) {
        if (group?.maxSelect && current.length >= group.maxSelect) return prev;
        return { ...prev, [groupId]: [...current, optionId] };
      } else {
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      }
    });
  };

  const calculateTotalPrice = () => {
    let total = item.price;
    item.modifierGroups?.forEach(group => {
      const selected = selectedOptions[group.id];
      if (!selected) return;
      const selectedIds = Array.isArray(selected) ? selected : [selected];
      selectedIds.forEach(optId => {
        const opt = group.options.find(o => o.id === optId);
        if (opt) total += opt.price;
      });
    });
    return total * quantity;
  };

  const handleAddToCart = () => {
    for (const group of item.modifierGroups || []) {
      if (group.required) {
        const selected = selectedOptions[group.id];
        const count = Array.isArray(selected) ? selected.length : (selected ? 1 : 0);
        if (count === 0) {
          setError(t('selectRequired', { group: getLocalizedName(group.name, group.translations) }));
          return;
        }
      }
    }

    const cartModifiers: CartModifier[] = [];
    item.modifierGroups?.forEach(group => {
      const selected = selectedOptions[group.id];
      if (!selected) return;
      const selectedIds = Array.isArray(selected) ? selected : [selected];
      selectedIds.forEach(optId => {
        const opt = group.options.find(o => o.id === optId);
        if (opt) {
          cartModifiers.push({
            groupId: group.id,
            groupName: getLocalizedName(group.name, group.translations),
            optionId: opt.id,
            optionName: getLocalizedName(opt.name, opt.translations),
            priceImpact: opt.price,
          });
        }
      });
    });

    const unitPrice = item.price + cartModifiers.reduce((sum, m) => sum + m.priceImpact, 0);
    const uid = `${item._id}_${JSON.stringify(cartModifiers)}_${notes}`;

    addItem({
      uid,
      menuItemId: item._id!,
      name: item.name,
      basePrice: item.price,
      price: unitPrice,
      quantity,
      notes,
      modifiers: cartModifiers,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] p-0 flex flex-col overflow-hidden rounded-xl border border-border shadow-2xl gap-0">

        {/* Фото блюда */}
        {item.image && (
          <div className="relative w-full h-52 shrink-0 overflow-hidden bg-muted">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Прокручиваемое тело */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* Заголовок */}
          <div className="px-6 pt-6 pb-5 border-b border-border">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground pr-8 leading-snug">
                {item.name}
              </DialogTitle>
              {item.description && (
                <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </DialogDescription>
              )}
            </DialogHeader>
          </div>

          {/* Группы модификаторов */}
          {item.modifierGroups?.map((group) => (
            <div key={group.id} className="border-b border-border last:border-b-0">
              <div className="px-6 pt-5 pb-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    {getLocalizedName(group.name, group.translations)}
                  </h3>
                  <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                    group.required
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {group.required ? t('required') : t('optional')}
                  </span>
                </div>

                {group.type === 'radio' ? (
                  <RadioGroup
                    value={selectedOptions[group.id] as string}
                    onValueChange={(val) => handleRadioChange(group.id, val)}
                    className="gap-0"
                  >
                    {group.options.map(opt => (
                      <Label
                        key={opt.id}
                        htmlFor={opt.id}
                        className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 rounded-lg px-3 -mx-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={opt.id} id={opt.id} />
                          <span className="text-sm text-foreground">
                            {getLocalizedName(opt.name, opt.translations)}
                          </span>
                        </div>
                        {opt.price > 0 && (
                          <span className="text-sm text-muted-foreground tabular-nums">
                            +{opt.price} {currency}
                          </span>
                        )}
                      </Label>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="gap-0">
                    {group.options.map(opt => {
                      const selectedArr = (selectedOptions[group.id] as string[]) || [];
                      const isChecked = selectedArr.includes(opt.id);
                      return (
                        <Label
                          key={opt.id}
                          htmlFor={opt.id}
                          className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 rounded-lg px-3 -mx-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={opt.id}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleCheckboxChange(group.id, opt.id, checked as boolean)}
                            />
                            <span className="text-sm text-foreground">
                              {getLocalizedName(opt.name, opt.translations)}
                            </span>
                          </div>
                          {opt.price > 0 && (
                            <span className="text-sm text-muted-foreground tabular-nums">
                              +{opt.price} {currency}
                            </span>
                          )}
                        </Label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* нижний отступ внутри секции */}
              <div className="pb-4" />
            </div>
          ))}

          {/* Заметки к заказу */}
          <div className="px-6 py-5 border-b border-border">
            <Label htmlFor="notes" className="block text-sm font-semibold uppercase tracking-wider text-foreground mb-3">
              {t('notes')}
            </Label>
            <Textarea
              id="notes"
              placeholder={t('notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none rounded-lg bg-muted/40 border border-border focus-visible:ring-1 focus-visible:ring-ring text-sm px-4 py-3"
              rows={2}
            />
          </div>

          {/* Ошибка */}
          {error && (
            <div className="mx-6 my-4 text-sm text-destructive font-medium bg-destructive/8 border border-destructive/20 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Прибитый футер */}
        <DialogFooter className="px-6 py-4 bg-background border-t border-border flex-row items-center justify-between gap-4 shrink-0">

          {/* Счётчик количества — строгий, без pill-фона */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-colors text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-semibold text-base text-foreground tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-colors text-foreground"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Кнопка: цена встроена */}
          <Button
            onClick={handleAddToCart}
            className="flex-1 h-11 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          >
            <span>{t('addToCart', { price: calculateTotalPrice().toFixed(2), currency })}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}