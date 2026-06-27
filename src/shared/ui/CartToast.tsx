'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

interface CartToastContextType {
  showToast: (productName: string) => void;
}

const CartToastContext = createContext<CartToastContextType>({
  showToast: () => {},
});

export function CartToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [productName, setProductName] = useState('');

  const showToast = useCallback((name: string) => {
    setProductName(name);
    setVisible(true);
    setTimeout(() => setVisible(false), 2500);
  }, []);

  return (
    <CartToastContext.Provider value={{ showToast }}>
      {children}
      {visible && <CartToastUI productName={productName} />}
    </CartToastContext.Provider>
  );
}

export function useCartToast() {
  return useContext(CartToastContext);
}

function CartToastUI({ productName }: { productName: string }) {
  const t = useTranslations('catalog');

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] sm:w-auto animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 px-6 py-4 bg-emerald-600/70 backdrop-blur-lg border border-white/20 text-white rounded-2xl shadow-2xl shadow-emerald-900/20 text-sm font-medium">
        <Check size={20} className="text-white shrink-0" />
        <span className="line-clamp-2">{t('addedToCart', { name: productName })}</span>
      </div>
    </div>
  );
}