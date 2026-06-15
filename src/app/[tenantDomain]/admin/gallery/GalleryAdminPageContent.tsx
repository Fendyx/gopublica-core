'use client';
import { useEffect, useState, useRef } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';

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

  if (branchLoading || loading) return <div className="text-center py-10">{t('loading')}</div>;
  if (!selectedBranch) return <div className="text-center py-10">Выберите филиал в переключателе справа вверху</div>;

  return (
    <div>
      <div className="mb-4 text-sm text-gray-500">
        Галерея для филиала: <strong>{selectedBranch.name}</strong> {selectedBranch.city && `(${selectedBranch.city})`}
      </div>
      <h2 className="text-xl font-semibold mb-4">{t('title')}</h2>

      <div className="bg-white p-6 rounded shadow mb-8">
        <h3 className="text-lg font-medium mb-3">{t('addPhoto')}</h3>
        <div className="flex gap-4 items-end">
          <input type="text" placeholder={t('caption')} value={caption} onChange={e => setCaption(e.target.value)} className="border p-2 rounded flex-1" />
          <button onClick={() => cloudinaryWidgetRef.current?.open()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t('selectPhoto')}</button>
        </div>
        {imageUrl && (
          <div className="mt-4 flex items-start gap-4">
            <img src={imageUrl} alt="preview" className="h-24 object-cover rounded" />
            <button onClick={handleAdd} className="px-4 py-2 rounded text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{t('addToGallery')}</button>
          </div>
        )}
      </div>

      {images.length === 0 ? <p className="text-zinc-500 text-center py-10">{t('empty')}</p> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(img => (
            <div key={img._id} className="group relative aspect-square rounded-lg overflow-hidden shadow-sm">
              <img src={img.image} alt={img.caption} className="w-full h-full object-cover" />
              {img.caption && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">{img.caption}</div>}
              <button onClick={() => handleDelete(img._id)} className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}