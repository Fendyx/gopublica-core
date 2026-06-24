'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: any | null;
  token: string;
  onSave: () => void;
}

export default function CategoryForm({ isOpen, onClose, editingCategory, token, onSave }: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: '📦',
    layout: 'grid-3',
    coverImage: '',
    cardBgColor: '',
    imageAspectRatio: '1/1',
    productImageAspectRatio: '1/1',
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (editingCategory) {
      setForm({
        name: editingCategory.name || '',
        description: editingCategory.description || '',
        icon: editingCategory.icon || '📦',
        layout: editingCategory.layout || 'grid-3',
        coverImage: editingCategory.coverImage || '',
        cardBgColor: editingCategory.cardBgColor || '',
        imageAspectRatio: editingCategory.imageAspectRatio || '1/1',
        productImageAspectRatio: editingCategory.productImageAspectRatio || '1/1',
      });
    } else {
      setForm({
        name: '',
        description: '',
        icon: '📦',
        layout: 'grid-3',
        coverImage: '',
        cardBgColor: '',
        imageAspectRatio: '1/1',
        productImageAspectRatio: '1/1',
      });
    }
  }, [editingCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let errorMessage = '';

    const url = editingCategory
      ? `${apiUrl}/api/saas/categories/${editingCategory._id}`
      : `${apiUrl}/api/saas/categories`;
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: editingCategory?.key || form.name.toLowerCase().replace(/\s+/g, '-'),
          name: form.name,
          description: form.description,
          icon: form.icon,
          layout: form.layout,
          coverImage: form.coverImage,
          cardBgColor: form.cardBgColor,
          niche: 'ecommerce',
          imageAspectRatio: form.imageAspectRatio,
          productImageAspectRatio: form.productImageAspectRatio,
        }),
      });

      if (res.ok) {
        setForm({
          name: '',
          description: '',
          icon: '📦',
          layout: 'grid-3',
          coverImage: '',
          cardBgColor: '',
          imageAspectRatio: '1/1',
          productImageAspectRatio: '1/1',
        });
        onSave();
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        errorMessage = errData.error || 'Failed to save category';
        console.error('Backend error:', errorMessage);
        alert(`Error: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[450px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle className="text-xl">{editingCategory ? 'Edit Category' : 'Add New Category'}</SheetTitle>
          <SheetDescription>
            {editingCategory ? 'Update the category details.' : 'Create a category to group your products.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Electronics"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-description">Description</Label>
              <Textarea
                id="cat-description"
                placeholder="e.g. Just landed"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-icon">Icon (Emoji)</Label>
                <Input
                  id="cat-icon"
                  placeholder="📦"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="text-center text-xl"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Display Layout</Label>
                <Select value={form.layout} onValueChange={(val) => setForm({ ...form, layout: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid-3">Grid (3 cols)</SelectItem>
                    <SelectItem value="grid-4">Grid (4 cols)</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="dynamic">Dynamic Bento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-cover">Cover Image URL</Label>
              <Input
                id="cat-cover"
                placeholder="https://images.unsplash.com/..."
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              />
              {form.coverImage && (
                <img src={form.coverImage} alt="Preview" className="w-full h-24 object-cover rounded-md border" />
              )}
            </div>

            {/* Пропорция для карточек категорий */}
            <div className="space-y-2">
              <Label>Category Card Image Aspect Ratio</Label>
              <Select value={form.imageAspectRatio} onValueChange={(val) => setForm({ ...form, imageAspectRatio: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1/1">Square (1:1)</SelectItem>
                  <SelectItem value="4/5">Portrait (4:5)</SelectItem>
                  <SelectItem value="3/4">Portrait (3:4)</SelectItem>
                  <SelectItem value="16/9">Landscape (16:9)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Пропорция для карточек продуктов ВНУТРИ категории */}
            <div className="space-y-2">
              <Label>Product Image Aspect Ratio</Label>
              <Select value={form.productImageAspectRatio} onValueChange={(val) => setForm({ ...form, productImageAspectRatio: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1/1">Square (1:1)</SelectItem>
                  <SelectItem value="4/5">Portrait (4:5)</SelectItem>
                  <SelectItem value="3/4">Portrait (3:4)</SelectItem>
                  <SelectItem value="16/9">Landscape (16:9)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-bg-color">Card Background Color</Label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={form.cardBgColor || '#ffffff'}
                  onChange={(e) => setForm({ ...form, cardBgColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer border border-border bg-transparent p-1"
                />
                <Input
                  placeholder="Empty = Default"
                  value={form.cardBgColor}
                  onChange={(e) => setForm({ ...form, cardBgColor: e.target.value })}
                  className="max-w-xs"
                />
                {form.cardBgColor && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm({ ...form, cardBgColor: '' })}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>

          <SheetFooter className="p-6 border-t border-border bg-background">
            <div className="flex justify-end gap-3 w-full">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Category'}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}