// src/app/[tenantDomain]/admin/ecommerce/page.tsx
'use client';
import { useState } from 'react';
import ProductManager from '@/widgets/Admin/ProductManager';

export default function EcommercePage() {
  const [token] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('saas_token');
    return null;
  });

  if (!token) return <div className="text-center py-10">Требуется авторизация</div>;
  return <ProductManager token={token} />;
}