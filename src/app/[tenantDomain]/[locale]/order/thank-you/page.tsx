// src/app/[tenantDomain]/[locale]/order/thank-you/page.tsx
'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { CheckCircle2, Receipt, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ThankYouPage() {
  const params = useSearchParams();
  const { locale, branchSlug } = useParams();
  const orderId = params.get('orderId') || `ORD-${Math.floor(Math.random() * 100000)}`;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gray-50/50">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 text-center relative overflow-hidden">
        {/* Декоративный фон сверху */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        {/* Иконка успеха */}
        <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-green-50/50">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
          Payment Successful
        </h1>
        <p className="text-gray-500 mb-8">
          Thank you! We've received your order and sent a confirmation email with your receipt.
        </p>

        {/* Карточка с деталями заказа (Идеально для записи видео) */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-8 text-left space-y-4">
          <div className="flex items-center gap-3 text-gray-700">
            <Receipt className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Order Number</p>
              <p className="font-medium font-mono text-gray-900">{orderId}</p>
            </div>
          </div>
          
          <div className="h-px w-full bg-gray-200"></div>
          
          <div className="flex items-center gap-3 text-gray-700">
            <Package className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</p>
              <p className="font-medium text-blue-600">Processing for fulfillment</p>
            </div>
          </div>
        </div>

        {/* Кнопка возврата в меню/каталог */}
        <Link 
          href={`/${locale}/menu`} 
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
