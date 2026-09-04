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
  Ticket,
  Navigation,
} from 'lucide-react';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';
import {
  fetchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  createEvent,
  updateEvent,
  deleteEvent,
} from '@/entities/article/api';
import type { Article, Event, SidebarType, ContentType } from '@/entities/article/types';
import { slugify } from '@/shared/lib/slugify';
import { ArticleEditor } from './ArticleEditor';
import { useToast } from '@/shared/ui/Toast';

interface ArticlesManagerProps {
  token: string;
}

export default function ArticlesManager({ token }: ArticlesManagerProps) {
  const t = useTranslations('admin.articlesManager');
  const tenant = useTenant();
  const { selectedBranch } = useBranch();
  const { showToast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    coverImage: '',
    videoUrl: '',
    body: '',
    author: '',
    publishedAt: '',
    isActive: true,
    seoTitle: '',
    seoDescription: '',
    // Content type
    contentType: 'article' as ContentType,
    // Sidebar type
    sidebarType: 'none' as SidebarType,
    // Event fields
    ticketPrice: 0,
    totalTickets: 0,
    eventDate: '',
    venueName: '',
  });

  const { openWidget: openCoverUpload, widgetReady: coverWidgetReady } = useCloudinaryUpload({
    resourceType: 'auto',
    onSuccess: (url: string, resourceType?: string) => {
      if (resourceType === 'video') {
        setForm((prev) => ({ ...prev, videoUrl: url, coverImage: '' }));
      } else {
        setForm((prev) => ({ ...prev, coverImage: url, videoUrl: '' }));
      }
    },
  });

  /** Auto-detect media type from URL and set the correct field */
  const handleMediaUrlChange = (url: string) => {
    const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
    if (isVideo) {
      setForm((prev) => ({ ...prev, videoUrl: url, coverImage: '' }));
    } else {
      setForm((prev) => ({ ...prev, coverImage: url, videoUrl: '' }));
    }
  };

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
    setSlugManuallyEdited(false);
    setForm({
      title: '',
      slug: '',
      coverImage: '',
      videoUrl: '',
      body: '',
      author: '',
      publishedAt: '',
      isActive: true,
      seoTitle: '',
      seoDescription: '',
      contentType: 'article',
      sidebarType: 'none',
      ticketPrice: 0,
      totalTickets: 0,
      eventDate: '',
      venueName: '',
    });
    setEditingArticle(null);
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setSlugManuallyEdited(true);
    setForm({
      title: article.title,
      slug: article.slug,
      coverImage: article.coverImage || '',
      videoUrl: article.videoUrl || '',
      body: article.body,
      author: article.author || '',
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString().slice(0, 16)
        : '',
      isActive: article.isActive,
      seoTitle: article.seoTitle || '',
      seoDescription: article.seoDescription || '',
      contentType: article.contentType || 'article',
      sidebarType: article.sidebarType || (article.isEvent ? 'tickets' : 'none'),
      ticketPrice: article.ticketPrice || 0,
      totalTickets: article.totalTickets || 0,
      eventDate: article.eventDate
        ? new Date(article.eventDate).toISOString().slice(0, 16)
        : '',
      venueName: article.venueName || '',
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleDelete = async (id: string, sidebarType?: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      if (sidebarType === 'tickets') {
        await deleteEvent(id, token);
      } else {
        await deleteArticle(id, token);
      }
      setArticles((prev) => prev.filter((a) => a._id !== id));
      showToast(t('deleteSuccess'), 'success');
    } catch (err: any) {
      console.error(err);
      let errorMessage = t('deleteError');
      if (err?.response) {
        try {
          const errData = await err.response.json();
          errorMessage = errData?.error || errData?.message || errorMessage;
        } catch {
          // If we can't parse JSON, use the default message
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isTickets = form.sidebarType === 'tickets';
      const isInfoPage = form.contentType === 'infoPage';
      const payload = {
        ...form,
        tenantId,
        branchId: selectedBranch?._id,
        // Clear author/date for info pages
        author: isInfoPage ? undefined : form.author,
        publishedAt: isInfoPage
          ? null
          : form.publishedAt
            ? new Date(form.publishedAt).toISOString()
            : null,
        eventDate: form.eventDate
          ? new Date(form.eventDate).toISOString()
          : null,
      };

      if (editingArticle) {
        if (isTickets) {
          await updateEvent(editingArticle._id, { ...payload, isEvent: true }, token);
        } else {
          await updateArticle(editingArticle._id, payload, token);
        }
        setArticles((prev) =>
          prev.map((a) =>
            a._id === editingArticle._id ? { ...a, ...payload } : a
          )
        );
      } else {
        let created;
        if (isTickets) {
          created = await createEvent({ ...payload, isEvent: true }, token);
        } else {
          created = await createArticle(payload, token);
        }
        setArticles((prev) => [created, ...prev]);
      }

      setShowForm(false);
      resetForm();
      showToast(t('saveSuccess'), 'success');
    } catch (err: any) {
      console.error(err);
      let errorMessage = t('saveError');
      if (err?.response) {
        try {
          const errData = await err.response.json();
          errorMessage = errData?.error || errData?.message || errorMessage;
        } catch {
          // If we can't parse JSON, use the default message
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
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
              {/* Content Type Toggle */}
              <div className="space-y-2">
                <Label className="font-medium">{t('contentType')}</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contentType"
                      value="article"
                      checked={form.contentType === 'article'}
                      onChange={() =>
                        setForm((prev) => ({ ...prev, contentType: 'article' }))
                      }
                      className="accent-primary"
                    />
                    <span className="text-sm">{t('contentTypeArticle')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contentType"
                      value="infoPage"
                      checked={form.contentType === 'infoPage'}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          contentType: 'infoPage',
                          // Clear metadata fields when switching to info page
                          author: '',
                          publishedAt: '',
                        }))
                      }
                      className="accent-primary"
                    />
                    <span className="text-sm">{t('contentTypeInfoPage')}</span>
                  </label>
                </div>
              </div>

              {/* Title & Slug */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('title')}</Label>
                  <Input
                    id="title"
                    placeholder={t('titlePlaceholder')}
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title,
                        slug: slugManuallyEdited ? prev.slug : slugify(title),
                      }));
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">{t('slug')}</Label>
                  <Input
                    id="slug"
                    placeholder={t('slugPlaceholder')}
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setForm((prev) => ({ ...prev, slug: e.target.value }));
                    }}
                    required
                  />
                </div>
              </div>

              {/* Cover Media — unified image/video field */}
              <div className="space-y-2">
                <Label htmlFor="coverMedia">Cover Media</Label>
                <div className="flex gap-2">
                  <Input
                    id="coverMedia"
                    placeholder="https://... (auto-detects image or video)"
                    value={form.coverImage || form.videoUrl || ''}
                    onChange={(e) => handleMediaUrlChange(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openCoverUpload()}
                    disabled={!coverWidgetReady}
                    className="gap-2 shrink-0"
                  >
                    <ImagePlus className="w-4 h-4" />
                    {t('upload')}
                  </Button>
                </div>
                {/* Dynamic preview — shows either image or video */}
                {form.coverImage && (
                  <Image
                    src={form.coverImage}
                    alt={t('coverPreview')}
                    width={128}
                    height={128}
                    className="object-cover rounded-lg border shadow-sm mt-2"
                  />
                )}
                {form.videoUrl && (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full max-w-md rounded-lg border shadow-sm mt-2"
                  >
                    <source src={form.videoUrl} type="video/mp4" />
                  </video>
                )}
              </div>

              {/* Author & Published At — hidden for info pages */}
              {form.contentType === 'article' && (
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
              )}

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="body">{t('body')}</Label>
                <ArticleEditor
                  body={form.body}
                  onChange={(body) => setForm({ ...form, body })}
                  placeholder={t('bodyPlaceholder')}
                />
              </div>

              {/* Sidebar Type: None / Tickets / Direction */}
              <div className="space-y-4 border-t pt-4">
                <Label className="font-medium">{t('sidebarType')}</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sidebarType"
                      value="none"
                      checked={form.sidebarType === 'none'}
                      onChange={() => setForm({ ...form, sidebarType: 'none' })}
                      className="accent-primary"
                    />
                    <span className="text-sm">{t('sidebarNone')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sidebarType"
                      value="tickets"
                      checked={form.sidebarType === 'tickets'}
                      onChange={() => setForm({ ...form, sidebarType: 'tickets' })}
                      className="accent-primary"
                    />
                    <Ticket className="w-4 h-4 text-primary" />
                    <span className="text-sm">{t('sellTickets')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sidebarType"
                      value="direction"
                      checked={form.sidebarType === 'direction'}
                      onChange={() => setForm({ ...form, sidebarType: 'direction' })}
                      className="accent-primary"
                    />
                    <Navigation className="w-4 h-4 text-primary" />
                    <span className="text-sm">{t('showDirection')}</span>
                  </label>
                </div>

                {form.sidebarType === 'tickets' && (
                  <div className="space-y-4 pl-10 border-l-2 border-primary/20 ml-2">
                    <h3 className="text-sm font-medium text-primary">{t('eventDetails')}</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ticketPrice">{t('ticketPrice')}</Label>
                        <Input
                          id="ticketPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={t('ticketPricePlaceholder')}
                          value={form.ticketPrice}
                          onChange={(e) =>
                            setForm({ ...form, ticketPrice: parseFloat(e.target.value) || 0 })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalTickets">{t('totalTickets')}</Label>
                        <Input
                          id="totalTickets"
                          type="number"
                          min="1"
                          placeholder={t('totalTicketsPlaceholder')}
                          value={form.totalTickets}
                          onChange={(e) =>
                            setForm({ ...form, totalTickets: parseInt(e.target.value) || 0 })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="eventDate">{t('eventDate')}</Label>
                        <Input
                          id="eventDate"
                          type="datetime-local"
                          value={form.eventDate}
                          onChange={(e) =>
                            setForm({ ...form, eventDate: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venueName">{t('venueName')}</Label>
                        <Input
                          id="venueName"
                          placeholder={t('venueNamePlaceholder')}
                          value={form.venueName}
                          onChange={(e) =>
                            setForm({ ...form, venueName: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                      <TableHead>{t('type')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article) => (
                      <TableRow key={article._id}>
                        <TableCell className="font-medium">
                          {article.title}
                          {article.sidebarType === 'tickets' && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              <Ticket className="w-3 h-3" />
                              {t('event')}
                            </span>
                          )}
                          {article.sidebarType === 'direction' && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                              <Navigation className="w-3 h-3" />
                              {t('direction')}
                            </span>
                          )}
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
                          {article.sidebarType === 'tickets' ? (
                            <span className="text-primary text-xs font-medium">
                              <Ticket className="w-3 h-3 inline mr-1" />
                              {t('event')}
                            </span>
                          ) : article.sidebarType === 'direction' ? (
                            <span className="text-blue-600 text-xs font-medium">
                              <Navigation className="w-3 h-3 inline mr-1" />
                              {t('direction')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              {t('article')}
                            </span>
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
                              onClick={() => handleDelete(article._id, article.sidebarType)}
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
