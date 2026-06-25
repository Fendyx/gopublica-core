'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, X, Plus, ImagePlus } from 'lucide-react';
import type { MenuItem, ProductVariant } from '@/entities/menu-item/types';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: MenuItem | null;
  categories: any[];
  token: string;
  branchId?: string;
  onSave: () => void;
}

export default function ProductForm({
  isOpen, onClose, editingProduct, categories, token, branchId, onSave,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    categoryKey: '__none__',   // по умолчанию None
    category: '',
    status: 'active',
    sku: '',
    stock: 0,
    compareAtPrice: 0,
    images: [] as string[],
    weight: 0,
    weightUnit: 'kg' as 'g' | 'kg' | 'lb',
    dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
    tags: [] as string[],
    variants: [] as ProductVariant[],
    isFeatured: false,
  });

  const [hasVariants, setHasVariants] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const { openWidget: openMainWidget, widgetReady: mainReady, isWidgetOpen: isMainWidgetOpen } = useCloudinaryUpload({
    onSuccess: (url) => setForm((prev) => ({ ...prev, image: url })),
  });

  const { openWidget: openExtraWidget, widgetReady: extraReady, isWidgetOpen: isExtraWidgetOpen } = useCloudinaryUpload({
    onSuccess: (url) => setForm((prev) => ({ ...prev, images: [...prev.images, url] })),
  });

  useEffect(() => {
    if (editingProduct) {
      const catKey = editingProduct.categoryKey || editingProduct.category || '';
      setForm({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        image: editingProduct.image || '',
        categoryKey: catKey === '' ? '__none__' : catKey,
        category: editingProduct.category || '',
        status: (editingProduct as any).status || 'active',
        sku: editingProduct.sku || '',
        stock: editingProduct.stock || 0,
        compareAtPrice: editingProduct.compareAtPrice || 0,
        images: editingProduct.images || [],
        weight: editingProduct.weight || 0,
        weightUnit: editingProduct.weightUnit || 'kg',
        dimensions: {
          length: editingProduct.dimensions?.length ?? 0,
          width: editingProduct.dimensions?.width ?? 0,
          height: editingProduct.dimensions?.height ?? 0,
          unit: editingProduct.dimensions?.unit ?? 'cm',
        },
        tags: editingProduct.tags || [],
        variants: editingProduct.variants || [],
        isFeatured: editingProduct.isFeatured || false,
      });
      setHasVariants(!!(editingProduct.variants && editingProduct.variants.length > 0));
    } else {
      setForm({
        name: '', description: '', price: 0, image: '',
        categoryKey: '__none__', category: '', status: 'active',
        sku: '', stock: 0, compareAtPrice: 0, images: [],
        weight: 0, weightUnit: 'kg', dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
        tags: [], variants: [],
        isFeatured: false,
      });
      setHasVariants(false);
    }
  }, [editingProduct, isOpen]);

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Math.random().toString(36).substring(2, 11),
      name: '',
      sku: '',
      price: 0,
      compareAtPrice: 0,
      stock: 0,
      attributes: {},
    };
    setForm({ ...form, variants: [...form.variants, newVariant] });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...form.variants];
    (updated[index] as any)[field] = value;
    setForm({ ...form, variants: updated });
  };

  const removeVariant = (index: number) => {
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!hasVariants && form.price <= 0) {
      alert('Укажите цену товара');
      return;
    }
    if (hasVariants && form.variants.length === 0) {
      alert('Добавьте хотя бы один вариант');
      return;
    }
    setLoading(true);

    const priceToSend = hasVariants
      ? Math.min(...form.variants.map(v => v.price || 0)) || 0
      : form.price;

    const payload = {
      ...form,
      categoryKey: form.categoryKey === '__none__' ? '' : form.categoryKey,
      category: form.categoryKey === '__none__' ? '' : form.category,
      price: priceToSend,
      branchId,
      productType: 'physical_product',
    };

    const url = editingProduct
      ? `${apiUrl}/api/saas/menu/${editingProduct._id}`
      : `${apiUrl}/api/saas/menu`;
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSave();
        onClose();
      } else {
        console.error('Failed to save product');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (url: string) => {
    setForm({ ...form, images: form.images.filter((img) => img !== url) });
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && (isMainWidgetOpen || isExtraWidgetOpen)) return;
        onClose();
      }}
      modal={false}
    >
      <SheetContent side="right" className="w-full sm:max-w-[550px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle className="text-xl">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </SheetTitle>
          <SheetDescription>
            {editingProduct
              ? 'Update the product details.'
              : 'Create a new product for your catalog.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* General */}
            <div className="space-y-4 border border-border rounded-xl p-4 bg-muted/20">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">General</h3>
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.categoryKey}
                    onValueChange={(val) => {
                      if (val === '__none__') {
                        setForm({ ...form, categoryKey: val, category: '' });
                      } else {
                        const selectedCat = categories.find((c) => c.key === val);
                        setForm({ ...form, categoryKey: val, category: selectedCat?.name || val });
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None (no category)</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.key} value={c.key}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Featured toggle */}
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="isFeatured"
                  checked={form.isFeatured}
                  onCheckedChange={(checked) => setForm({ ...form, isFeatured: checked })}
                />
                <Label htmlFor="isFeatured">Featured Product</Label>
              </div>
            </div>

            {/* Product type toggle */}
            <div className="flex items-center justify-between border rounded-xl p-4 bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Товар с вариантами</p>
                <p className="text-xs text-muted-foreground">Включите, если у товара есть размеры, цвета и разные цены</p>
              </div>
              <Switch checked={hasVariants} onCheckedChange={setHasVariants} />
            </div>

            {/* Simple product pricing */}
            {!hasVariants && (
              <div className="space-y-4 border border-border rounded-xl p-4 bg-muted/20">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Pricing & Inventory</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" type="number" value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: +e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input id="price" type="number" step="0.01" value={form.price || ''} onChange={(e) => setForm({ ...form, price: +e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compareAtPrice">Compare At Price</Label>
                    <Input id="compareAtPrice" type="number" step="0.01" value={form.compareAtPrice || ''} onChange={(e) => setForm({ ...form, compareAtPrice: +e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* Variants management */}
            {hasVariants && (
              <div className="space-y-4 border border-border rounded-xl p-4 bg-muted/20">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Variants</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus size={14} /> Add Variant</Button>
                </div>
                {form.variants.length === 0 && <p className="text-sm text-muted-foreground">Нет вариантов. Добавьте первый вариант.</p>}
                {form.variants.map((variant, idx) => (
                  <div key={variant.id} className="border rounded-lg p-3 space-y-2 bg-background">
                    <div className="flex justify-between">
                      <span className="text-xs font-semibold">Variant #{idx + 1}</span>
                      <button type="button" onClick={() => removeVariant(idx)}><X size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Name (e.g. S, Red)" value={variant.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} />
                      <Input placeholder="SKU" value={variant.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="number" placeholder="Price" value={variant.price || ''} onChange={(e) => updateVariant(idx, 'price', +e.target.value)} />
                      <Input type="number" placeholder="Compare At" value={variant.compareAtPrice || ''} onChange={(e) => updateVariant(idx, 'compareAtPrice', +e.target.value)} />
                      <Input type="number" placeholder="Stock" value={variant.stock || ''} onChange={(e) => updateVariant(idx, 'stock', +e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Media */}
            <div className="space-y-4 border border-border rounded-xl p-4 bg-muted/20">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Media</h3>
              <div className="space-y-2">
                <Label htmlFor="image">Main Image</Label>
                <div className="flex gap-2">
                  <Input id="image" placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                  <Button type="button" variant="outline" onClick={openMainWidget} disabled={!mainReady} className="gap-2 shrink-0">
                    <ImagePlus className="w-4 h-4" /> Upload
                  </Button>
                </div>
                {form.image && <img src={form.image} alt="Preview" className="w-full h-32 object-cover rounded-lg border" />}
              </div>
              <div className="space-y-2">
                <Label>Additional Images</Label>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border">
                      <img src={url} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(url)} className="absolute top-0 right-0 bg-black/60 text-white p-0.5"><X size={12} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={openExtraWidget} disabled={!extraReady} className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <ImagePlus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="space-y-4 border border-border rounded-xl p-4 bg-muted/20">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Shipping</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Input type="number" value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: +e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={form.weightUnit} onValueChange={(val) => setForm({ ...form, weightUnit: val as 'g' | 'kg' | 'lb' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Length</Label><Input type="number" value={form.dimensions.length || ''} onChange={(e) => setForm({ ...form, dimensions: { ...form.dimensions, length: +e.target.value } })} /></div>
                <div><Label>Width</Label><Input type="number" value={form.dimensions.width || ''} onChange={(e) => setForm({ ...form, dimensions: { ...form.dimensions, width: +e.target.value } })} /></div>
                <div><Label>Height</Label><Input type="number" value={form.dimensions.height || ''} onChange={(e) => setForm({ ...form, dimensions: { ...form.dimensions, height: +e.target.value } })} /></div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4 border border-border rounded-xl p-4 bg-muted/20">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Tags</h3>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-sm">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="p-6 border-t border-border bg-background">
            <div className="flex justify-end gap-3 w-full">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Product'}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}