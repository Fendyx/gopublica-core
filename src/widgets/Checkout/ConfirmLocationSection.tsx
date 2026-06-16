import { Store, Truck, MapPin, User, Phone, Mail } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmLocationSection({ 
  fulfillmentType, setFulfillmentType, address, setAddress, deliveryInstructions, setDeliveryInstructions, customer, setCustomer 
}: any) {
  return (
    <div className="bg-surface-card rounded-2xl shadow-card p-6 border border-border">
      <h2 className="text-xl font-semibold mb-6">2. Confirm Location & Contact</h2>
      
      {/* Тоггл Доставка / Самовывоз */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setFulfillmentType('pickup')}
          className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-medium transition-all ${fulfillmentType === 'pickup' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-border-light'}`}
        >
          <Store size={20} /> Самовывоз
        </button>
        <button
          type="button"
          onClick={() => setFulfillmentType('delivery')}
          className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-medium transition-all ${fulfillmentType === 'delivery' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-border-light'}`}
        >
          <Truck size={20} /> Доставка
        </button>
      </div>

      {/* Адрес доставки (анимированный) */}
      <AnimatePresence>
        {fulfillmentType === 'delivery' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden mb-6">
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-text-tertiary" />
              <input required className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface-page" placeholder="Улица" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
            </div>
            {/* ... остальные инпуты города, индекса и комментариев из твоего кода ... */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Контакты */}
      <div className="space-y-3 pt-6 border-t border-border-light">
        <h3 className="text-sm font-medium text-text-secondary mb-2">Контактные данные</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input required className="w-full px-4 py-3 rounded-xl border border-border bg-surface-page" placeholder="Имя" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
          <input required className="w-full px-4 py-3 rounded-xl border border-border bg-surface-page" placeholder="Телефон" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
        </div>
        <input required type="email" className="w-full px-4 py-3 rounded-xl border border-border bg-surface-page" placeholder="Email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
      </div>
    </div>
  );
}