'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import {
  fetchAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from '@/entities/product-attribute/api';
import type { ProductAttribute } from '@/entities/product-attribute/types';
import type { AttributeType } from '@/entities/menu-item/types';

const ATTRIBUTE_TYPES: { type: AttributeType; label: string; icon: string }[] = [
  { type: 'author', label: 'Authors', icon: '✍️' },
  { type: 'publisher', label: 'Publishers', icon: '🏛️' },
  { type: 'genre', label: 'Genres', icon: '📚' },
  { type: 'language', label: 'Languages', icon: '🌍' },
  { type: 'series', label: 'Series', icon: '📖' },
  { type: 'custom', label: 'Custom', icon: '🏷️' },
];

export default function AttributeManager({ token }: { token: string }) {
  const t = useTranslations('admin.attributeManager');
  const tenant = useTenant();
  const [activeType, setActiveType] = useState<AttributeType>('author');
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductAttribute | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const loadAttributes = useCallback(async () => {
    if (!tenant?.tenantId) return;
    setLoading(true);
    try {
      const data = await fetchAttributes(tenant.tenantId, activeType);
      setAttributes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenant?.tenantId, activeType]);

  useEffect(() => {
    loadAttributes();
  }, [loadAttributes]);

  const filtered = attributes.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormDescription('');
    setIsDialogOpen(true);
  };

  const openEdit = (attr: ProductAttribute) => {
    setEditing(attr);
    setFormName(attr.name);
    setFormDescription(attr.description || '');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateAttribute(editing._id, { name: formName.trim(), description: formDescription }, token);
      } else {
        await createAttribute({ type: activeType, name: formName.trim(), description: formDescription }, token);
      }
      setIsDialogOpen(false);
      loadAttributes();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attribute?')) return;
    try {
      await deleteAttribute(id, token);
      loadAttributes();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Manage Product Attributes</h3>
        <p className="text-sm text-muted-foreground">
          Create and manage authors, publishers, genres, languages, and series that can be linked to products.
        </p>
      </div>

      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as AttributeType)}>
        <TabsList className="bg-muted/50">
          {ATTRIBUTE_TYPES.map(({ type, label, icon }) => (
            <TabsTrigger key={type} value={type} className="text-xs">
              {icon} {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeType} className="mt-4">
          <Card className="p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder={`Search ${activeType}s...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm"
                />
              </div>
              <Button className="gap-2" onClick={openCreate} size="sm">
                <Plus className="w-4 h-4" /> Add {activeType}
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-10 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                No {activeType}s found. Create one to get started.
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((attr) => (
                      <TableRow key={attr._id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">{attr.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">{attr.slug}</TableCell>
                        <TableCell className="text-muted-foreground">{attr.productCount || 0}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(attr)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(attr._id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${activeType}` : `Create ${activeType}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={`e.g. ${activeType === 'author' ? 'Serhiy Zhadan' : activeType === 'genre' ? 'Fantasy' : '...'}`}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
