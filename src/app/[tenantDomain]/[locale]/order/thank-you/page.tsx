'use client';

import { useSearchParams } from 'next/navigation';

export default function ThankYouPage() {
  const params = useSearchParams();
  const orderId = params.get('orderId');

  return (
    <div className="max-w-md mx-auto text-center py-20">
      <h1 className="text-2xl font-heading font-bold mb-4">Спасибо за заказ!</h1>
      {orderId && <p className="text-sm text-gray-600">Номер заказа: {orderId}</p>}
      <p className="mt-4">Ресторан уже получил уведомление. Статус заказа появится в личном кабинете (в будущем).</p>
    </div>
  );
}