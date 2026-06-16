import { CreditCard } from 'lucide-react';
import { CardElement } from '@stripe/react-stripe-js';

export default function PaymentSection() {
  return (
    <div className="bg-surface-card rounded-2xl shadow-card p-6 border border-border">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        3. Payment
      </h2>
      <div className="p-4 rounded-xl border border-border bg-surface-page">
        <CardElement
          options={{
            style: {
              base: { fontSize: '16px', color: 'var(--color-text-primary)', '::placeholder': { color: 'var(--color-text-tertiary)' } },
            },
          }}
        />
      </div>
    </div>
  );
}