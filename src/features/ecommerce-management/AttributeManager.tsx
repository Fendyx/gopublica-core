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
  fetchAttributeGroups,
} from '@/entities/product-attribute/api';
import type { ProductAttribute, ProductAttributeGroup } from '@/entities/product-attribute/types';

const SUPPORTED_LOCALES = ['en', 'pl', 'de', 'ua', 'es'];

export default function AttributeManager({ token }: { token: string }) {
  const t = useTranslations('admin.attributeManager');
  const tenant = useTenant();
  const [groups, setGroups] = useState<ProductAttributeGroup[]>([]);
  const [activeGroupSlug, setActiveGroupSlug] = useState<string>('');
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductAttribute | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTranslations, setFormTranslations] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Load attribute groups
  const loadGroups = useCallback(async () => {
    if (!tenant?.tenantId) return;
    try {
      const data = await fetchAttributeGroups(tenant.tenantId);
      setGroups(data);
      if (data.length > 0 && !activeGroupSlug) {
        setActiveGroupSlug(data[0].slug);
      }
    } catch (err) {
      console.error(err);
    }
  }, [tenant?.tenantId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const activeGroup = groups.find((g) => g.slug === activeGroupSlug);

  const loadAttributes = useCallback(async () => {
    if (!tenant?.tenantId || !activeGroupSlug) {
      setAttributes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAttributes(tenant.tenantId, activeGroupSlug);
      setAttributes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenant?.tenantId, activeGroupSlug]);

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
    setFormTranslations({});
    setIsDialogOpen(true);
  };

  const openEdit = (attr: ProductAttribute) => {
    setEditing(attr);
    setFormName(attr.name);
    setFormDescription(attr.description || '');
    // Populate translation fields from existing translations
    const trans: Record<string, string> = {};
    for (const locale of SUPPORTED_LOCALES) {
      trans[locale] = attr.translations?.[locale]?.name || '';
    }
    setFormTranslations(trans);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !activeGroupSlug) return;
    setSaving(true);
    try {
      // Build translations object
      const translations: Record<string, { name: string }> = {};
      for (const locale of SUPPORTED_LOCALES) {
        if (formTranslations[locale]?.trim()) {
          translations[locale] = { name: formTranslations[locale].trim() };
        }
      }

      if (editing) {
        await updateAttribute(
          editing._id,
          { name: formName.trim(), description: formDescription, translations },
          token,
        );
      } else {
        await createAttribute(
          { type: activeGroupSlug, name: formName.trim(), description: formDescription, translations },
          token,
        );
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
          Create and manage attributes organized in groups that can be linked to products.
        </p>
      </div>

      {groups.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No attribute groups found. Create attribute groups first in the "Groups" tab.
        </Card>
      ) : (
        <Tabs value={activeGroupSlug} onValueChange={(v) => { setActiveGroupSlug(v); setSearchQuery(''); }}>
          <TabsList className="bg-muted/50">
            {groups.map((group) => (
              <TabsTrigger key={group.slug} value={group.slug} className="text-xs">
                {group.icon} {group.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeGroupSlug} className="mt-4">
            <Card className="p-4 lg:p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    placeholder={`Search ${activeGroup?.name || 'attributes'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
                <Button className="gap-2" onClick={openCreate} size="sm">
                  <Plus className="w-4 h-4" /> Add {activeGroup?.name || 'attribute'}
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-10 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading...
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                  No attributes found. Create one to get started.
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Translations</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((attr) => (
                        <TableRow key={attr._id} className="hover:bg-muted/20">
                          <TableCell className="font-medium">{attr.name}</TableCell>
                          <TableCell className="text-muted-foreground text-xs font-mono">{attr.slug}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {attr.translations
                              ? Object.entries(attr.translations)
                                  .filter(([, v]) => v?.name)
                                  .map(([locale]) => locale.toUpperCase())
                                  .join(', ') || '—'
                              : '—'}
                          </TableCell>
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
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${activeGroup?.name || 'attribute'}` : `Create ${activeGroup?.name || 'attribute'}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name (default locale)</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Serhiy Zhadan"
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
            {/* Translation fields */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Translations</Label>
              <div className="grid grid-cols-1 gap-2">
                {SUPPORTED_LOCALES.map((locale) => (
                  <div key={locale} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-8 uppercase">{locale}</span>
                    <Input
                      value={formTranslations[locale] || ''}
                      onChange={(e) => setFormTranslations({ ...formTranslations, [locale]: e.target.value })}
                      placeholder={`Name in ${locale}...`}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
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
