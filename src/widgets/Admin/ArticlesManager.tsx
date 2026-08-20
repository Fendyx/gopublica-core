'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Plus,
  Trash2,
  Edit,
  X,
  ImagePlus,
  Save,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';
import {
  fetchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from '@/entities/article/api';
import type { Article } from '@/entities/article/types';

interface ArticlesManagerProps {
  token: string;
}

export default function ArticlesManager({ token }: ArticlesManagerProps) {
  const t = useTranslations('admin.articlesManager');
  const tenant = useTenant();
  const { selectedBranch } = useBranch();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    coverImage: '',
    body: '',
    author: '',
    publishedAt: '',
    isActive: true,
    seoTitle: '',
    seoDescription: '',
  });

  const { openWidget, widgetReady } = useCloudinaryUpload({
    onSuccess: (url: string) => {
      setForm((prev) => ({ ...prev, coverImage: url }));
    },
  });

  const tenantId = tenant?.tenantId || '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchAll = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await fetchArticles(tenantId, token, selectedBranch?._id);
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, selectedBranch?._id]);

  const resetForm = () => {
    setForm({
      title: '',
      slug: '',
      coverImage: '',
      body: '',
      author: '',
      publishedAt: '',
      isActive: true,
      seoTitle: '',
      seoDescription: '',
    });
    setEditingArticle(null);
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      slug: article.slug,
      coverImage: article.coverImage || '',
      body: article.body,
      author: article.author || '',
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString().slice(0, 16)
        : '',
      isActive: article.isActive,
      seoTitle: article.seoTitle || '',
      seoDescription: article.seoDescription || '',
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await deleteArticle(id, token);
      setArticles((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tenantId,
        branchId: selectedBranch?._id,
        publishedAt: form.publishedAt
          ? new Date(form.publishedAt).toISOString()
          : null,
      };

      if (editingArticle) {
        await updateArticle(editingArticle._id, payload, token);
        setArticles((prev) =>
          prev.map((a) =>
            a._id === editingArticle._id ? { ...a, ...payload } : a
          )
        );
      } else {
        const created = await createArticle(payload, token);
        setArticles((prev) => [created, ...prev]);
      }

      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Edit className="w-5 h-5 text-primary" />
          {t('title')}
        </h2>
        <Button
          onClick={handleAddNew}
          variant={showForm ? 'secondary' : 'default'}
          className="gap-2"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              {t('closeForm')}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {t('addArticle')}
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>
              {editingArticle ? t('editArticle') : t('newArticle')}
            </CardTitle>
            <CardDescription>
              {t('formDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Title & Slug */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('title')}</Label>
                  <Input
                    id="title"
                    placeholder={t('titlePlaceholder')}
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">{t('slug')}</Label>
                  <Input
                    id="slug"
                    placeholder={t('slugPlaceholder')}
                    value={form.slug}
                    onChange={(e) =>
                      setForm({ ...form, slug: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label htmlFor="coverImage">{t('coverImage')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="coverImage"
                    placeholder="https://..."
                    value={form.coverImage}
                    onChange={(e) =>
                      setForm({ ...form, coverImage: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openWidget}
                    disabled={!widgetReady}
                    className="gap-2 shrink-0"
                  >
                    <ImagePlus className="w-4 h-4" />
                    {t('upload')}
                  </Button>
                </div>
                {form.coverImage && (
                  <Image
                    src={form.coverImage}
                    alt={t('coverPreview')}
                    width={128}
                    height={128}
                    className="object-cover rounded-lg border shadow-sm mt-2"
                  />
                )}
              </div>

              {/* Author & Published At */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">{t('author')}</Label>
                  <Input
                    id="author"
                    placeholder={t('authorPlaceholder')}
                    value={form.author}
                    onChange={(e) =>
                      setForm({ ...form, author: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publishedAt">{t('publishedAt')}</Label>
                  <Input
                    id="publishedAt"
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) =>
                      setForm({ ...form, publishedAt: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="body">{t('body')}</Label>
                <Textarea
                  id="body"
                  placeholder={t('bodyPlaceholder')}
                  value={form.body}
                  onChange={(e) =>
                    setForm({ ...form, body: e.target.value })
                  }
                  rows={8}
                  required
                />
              </div>

              {/* SEO */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t('seo')}</h3>
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">{t('seoTitle')}</Label>
                  <Input
                    id="seoTitle"
                    placeholder={t('seoTitlePlaceholder')}
                    value={form.seoTitle}
                    onChange={(e) =>
                      setForm({ ...form, seoTitle: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">{t('seoDescription')}</Label>
                  <Textarea
                    id="seoDescription"
                    placeholder={t('seoDescriptionPlaceholder')}
                    value={form.seoDescription}
                    onChange={(e) =>
                      setForm({ ...form, seoDescription: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, isActive: checked })
                  }
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {t('isActive')}
                </Label>
              </div>

              {/* Form actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? t('saving') : t('save')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Articles table */}
      {!showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t('articlesList')}</CardTitle>
            <CardDescription>{t('articlesCount', { count: articles.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            {articles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('noArticles')}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('title')}</TableHead>
                      <TableHead>{t('slug')}</TableHead>
                      <TableHead>{t('author')}</TableHead>
                      <TableHead>{t('publishedAt')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article) => (
                      <TableRow key={article._id}>
                        <TableCell className="font-medium">
                          {article.title}
                        </TableCell>
                        <TableCell>{article.slug}</TableCell>
                        <TableCell>{article.author || '—'}</TableCell>
                        <TableCell>
                          {article.publishedAt ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {new Date(article.publishedAt).toLocaleDateString()}
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {article.isActive ? (
                            <span className="text-green-600 text-xs font-medium">
                              {t('active')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              {t('inactive')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(article)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(article._id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
