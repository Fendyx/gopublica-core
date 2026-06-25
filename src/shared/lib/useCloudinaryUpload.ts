'use client';
import { useEffect, useRef, useState } from 'react';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'menu_photos';

interface UseCloudinaryUploadOptions {
  onSuccess?: (url: string, resourceType?: string) => void;
  resourceType?: 'image' | 'video' | 'auto'; // по умолчанию auto
}

export function useCloudinaryUpload({
  onSuccess,
  resourceType = 'auto',
}: UseCloudinaryUploadOptions = {}) {
  const widgetRef = useRef<any>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  useEffect(() => {
    if (document.getElementById('cloudinary-widget-script')) {
      if ((window as any).cloudinary && !widgetRef.current) initWidget();
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
    const config: any = {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      sources: ['local', 'url', 'camera'],
      multiple: false,
      maxFileSize: 10000000, // увеличим лимит для видео
      resourceType: resourceType, // разрешаем и фото, и видео
      language: 'ru',
    };
    // Убираем clientAllowedFormats, чтобы не ограничивать
    // Если хочешь оставить ограничение на типы для изображений,
    // можно передать resourceType: 'image' в конкретном месте.

    widgetRef.current = (window as any).cloudinary.createUploadWidget(
      config,
      (error: any, result: any) => {
        if (result?.event === 'close') {
          setIsWidgetOpen(false);
        }
        if (!error && result?.event === 'success') {
          const uploadedUrl = result.info.secure_url;
          const uploadedResourceType = result.info.resource_type;
          onSuccess?.(uploadedUrl, uploadedResourceType);
        }
      }
    );
    setWidgetReady(true);
  };

  const openWidget = () => {
    if (widgetRef.current && widgetReady) {
      setIsWidgetOpen(true);
      widgetRef.current.open();
    } else {
      alert('Uploader is not ready yet.');
    }
  };

  return { openWidget, widgetReady, isWidgetOpen };
}