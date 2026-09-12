'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import EmojiPickerButton from '@/shared/ui/EmojiPickerButton';
import {
  fetchAttributeGroups,
  createAttributeGroup,
  updateAttributeGroup,
  deleteAttributeGroup,
  reorderAttributeGroups,
} from '@/entities/product-attribute/api';
import type { ProductAttributeGroup } from '@/entities/product-attribute/types';

const SUPPORTED_LOCALES = ['en', 'pl', 'de', 'ua', 'es'];

export default function AttributeGroupManager({ token }: { token: string }) {
  const tenant = useTenant();
  const [groups, setGroups] = useState<ProductAttributeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductAttributeGroup | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formTranslations, setFormTranslations] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!tenant?.tenantId) return;
    setLoading(true);
    try {
      const data = await fetchAttributeGroups(tenant.tenantId);
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenant?.tenantId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormIcon('🏷️');
    setFormTranslations({});
    setIsDialogOpen(true);
  };

  const openEdit = (group: ProductAttributeGroup) => {
    setEditing(group);
    setFormName(group.name);
    setFormIcon(group.icon || '');
    const trans: Record<string, string> = {};
    for (const locale of SUPPORTED_LOCALES) {
      trans[locale] = group.translations?.[locale]?.name || '';
    }
    setFormTranslations(trans);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const translations: Record<string, { name: string }> = {};
      for (const locale of SUPPORTED_LOCALES) {
        if (formTranslations[locale]?.trim()) {
          translations[locale] = { name: formTranslations[locale].trim() };
        }
      }

      if (editing) {
        await updateAttributeGroup(
          editing._id,
          { name: formName.trim(), icon: formIcon, translations },
          token,
        );
      } else {
        await createAttributeGroup(
          { name: formName.trim(), icon: formIcon, translations, sortOrder: groups.length },
          token,
        );
      }
      setIsDialogOpen(false);
      loadGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group? This will NOT delete its attributes.')) return;
    try {
      await deleteAttributeGroup(id, token);
      loadGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newGroups = [...groups];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newGroups.length) return;

    // Swap
    [newGroups[index], newGroups[swapIndex]] = [newGroups[swapIndex], newGroups[index]];
    setGroups(newGroups);

    try {
      await reorderAttributeGroups(newGroups.map((g) => g._id), token);
    } catch (err: any) {
      console.error(err);
      loadGroups(); // revert on failure
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Attribute Groups</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage folders for organizing product attributes (e.g. Authors, Genres, Custom).
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" /> Add Group
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading...
        </div>
      ) : groups.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground border border-dashed">
          No attribute groups yet. Create one to start organizing your product attributes.
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10"></TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Translations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group, index) => (
                <TableRow key={group._id} className="hover:bg-muted/20">
                  <TableCell className="text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="disabled:opacity-30 hover:text-foreground"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === groups.length - 1}
                        className="disabled:opacity-30 hover:text-foreground"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-lg">{group.icon || '🏷️'}</TableCell>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{group.slug}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {group.translations
                      ? Object.entries(group.translations)
                          .filter(([, v]) => v?.name)
                          .map(([locale]) => locale.toUpperCase())
                          .join(', ') || '—'
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(group)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(group._id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Attribute Group' : 'Create Attribute Group'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-4">
              <div className="space-y-2 w-20">
                <Label>Icon</Label>
                <div className="flex gap-1 items-center">
                  <Input
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="🏷️"
                    className="text-center text-lg"
                  />
                  <EmojiPickerButton value={formIcon} onChange={setFormIcon} />
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <Label>Name (default locale)</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Authors, Genres, Custom Folder"
                  autoFocus
                />
              </div>
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
