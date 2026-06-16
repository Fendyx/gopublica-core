'use client';
import { useEffect, useState, useRef } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload,
  Trash2,
  ImagePlus,
  X,
  Loader2,
  ImageIcon,
} from 'lucide-react';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'твой-cloud-name';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'menu_photos';

type GalleryItem = {
  _id: string;
  image: string;
  caption?: string;
  order?: number;
};

export default function GalleryAdminPage() {
  const t = useTranslations('admin.galleryPage');
  const tenant = useTenant();
  const { selectedBranch, loading: branchLoading } = useBranch();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [widgetReady, setWidgetReady] = useState(false);
  const cloudinaryWidgetRef = useRef<any>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token');
    if (!savedToken) window.location.href = '/admin/login';
    else setToken(savedToken);
  }, []);

  const fetchImages = async () => {
    if (!token || !selectedBranch) return;
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/gallery?tenantId=${tenant?.tenantId}&branchId=${selectedBranch._id}`;
      const res = await fetch(url);
      const data = await res.json();
      setImages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && !branchLoading && selectedBranch) fetchImages();
  }, [token, selectedBranch, branchLoading, tenant]);

  useEffect(() => {
    if (document.getElementById('cloudinary-widget-script')) {
      if ((window as any).cloudinary && !cloudinaryWidgetRef.current) initWidget();
      return;
    }
    const script = document.createElement('script');
    script.id = 'cloudinary-widget-script';
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.async = true;
    script.onload = () => initWidget();
    document.body.appendChild(script);
  }, []);

  const initWidget = () => {
    if (!(window as any).cloudinary) return;
    cloudinaryWidgetRef.current = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFileSize: 5000000,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        language: 'ru',
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') setImageUrl(result.info.secure_url);
      }
    );
    setWidgetReady(true);
  };

  const handleAdd = async () => {
    if (!imageUrl || !token || !selectedBranch) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: imageUrl, caption, branchId: selectedBranch._id }),
      });
      setImageUrl('');
      setCaption('');
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/gallery/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  if (branchLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!selectedBranch) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Выберите филиал в переключателе справа вверху</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">{t('title')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Галерея для филиала: <strong>{selectedBranch.name}</strong>
          {selectedBranch.city && ` (${selectedBranch.city})`}
        </p>
      </div>

      {/* Форма добавления */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('addPhoto')}</CardTitle>
          <CardDescription>Загрузите изображение через Cloudinary или вставьте URL вручную</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder={t('caption')}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => cloudinaryWidgetRef.current?.open()}
              disabled={!widgetReady}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {t('selectPhoto')}
            </Button>
          </div>

          {imageUrl && (
            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
              <img
                src={imageUrl}
                alt="preview"
                className="h-24 w-24 object-cover rounded-lg shadow-sm"
              />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground break-all">{imageUrl}</p>
                <div className="flex gap-2">
                  <Button onClick={handleAdd} className="gap-2">
                    <ImagePlus className="w-4 h-4" />
                    {t('addToGallery')}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setImageUrl('')}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Сетка изображений */}
      {images.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">{t('empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <Card key={img._id} className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative aspect-square">
                <img
                  src={img.image}
                  alt={img.caption || ''}
                  className="w-full h-full object-cover"
                />
                {/* Кнопка удаления */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(img._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {/* Подпись */}
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs p-2">
                    {img.caption}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}