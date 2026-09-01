'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStripe, useElements, Elements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslations } from 'next-intl';
import { usePlatformCartStore } from '@/shared/store/platformCartStore';
import { useTenant } from '@/entities/tenant/TenantContext';
import {
  createPlatformOrder,
  type PlatformOrderPayload,
} from '@/entities/platformProduct/api';
import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ShoppingCart, CreditCard, Truck, ArrowLeft, Loader2, CheckCircle,
  Box, Fuel, Building2, User, MapPin,
} from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Furgonetka carriers ──────────────────────────────────────────────────
const CARRIERS = [
  { id: 'inpost', label: 'InPost Paczkomaty', Icon: Box },
  { id: 'orlen', label: 'Orlen Paczka', Icon: Fuel },
  { id: 'dpd', label: 'DPD Pickup', Icon: Truck },
];

// ─── Furgonetka map widget ────────────────────────────────────────────────
interface ParcelLocker {
  id: string;
  network?: string;
  address?: { street?: string; city?: string; zip?: string };
}

function LockerPicker({
  mapApiKey,
  mapEnv,
  onSelect,
  selectedLocker,
}: {
  mapApiKey: string;
  mapEnv: string;
  onSelect: (locker: ParcelLocker) => void;
  selectedLocker: ParcelLocker | null;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    const scriptId = 'furgonetka-map-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (script) {
      if (script.getAttribute('data-loaded') === 'true') {
        setLoading(false);
      } else {
        script.addEventListener('load', () => setLoading(false));
      }
    } else {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://furgonetka.pl/js/dist/map/map.js';
      script.async = true;
      script.onload = () => {
        script.setAttribute('data-loaded', 'true');
        setScriptFailed(false);
        setLoading(false);
      };
      script.onerror = () => {
        setScriptFailed(true);
        setLoading(false);
      };
      document.head.appendChild(script);
    }
  }, []);

  const openMap = (carrierIds?: string[]) => {
    setError(null);
    if (!mapApiKey) {
      setError('Parcel locker map is not configured for this store.');
      return;
    }
    if (scriptFailed || !(window as any).Furgonetka?.Map) {
      const isDev = window.location.hostname === 'localhost';
      setError(
        isDev
          ? 'Parcel locker map is unavailable on localhost. Deploy to production to test.'
          : 'Map widget failed to load. Please try again.'
      );
      return;
    }
    try {
      const config: any = {
        apiKey: mapApiKey,
        env: mapEnv || 'sandbox',
        locale: 'pl',
        callback: (point: any) => {
          onSelect({
            id: point.code,
            network: point.type || 'inpost',
            address: {
              street: point.name || '',
              city: point.city || '',
              zip: point.postcode || '',
            },
          });
        },
      };
      if (carrierIds && carrierIds.length > 0) {
        config.courierServices = carrierIds;
      }
      const mapWidget = new (window as any).Furgonetka.Map(config);
      mapWidget.show();
    } catch (e) {
      setError('Failed to open map widget.');
    }
  };

  return (
    <div className="space-y-3">
      {/* Carrier selection buttons */}
      <div className="grid grid-cols-3 gap-2">
        {CARRIERS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => openMap([id])}
            disabled={loading}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
              selectedLocker?.network === id
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            } disabled:opacity-50`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => openMap()}
        disabled={loading}
        className="w-full"
        type="button"
        size="sm"
      >
        <MapPin className="w-4 h-4 mr-2" />
        {selectedLocker ? 'Change locker' : loading ? 'Loading map…' : 'Show all carriers'}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {selectedLocker && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
          <p className="font-medium text-primary">{selectedLocker.id}</p>
          {selectedLocker.network && <p className="text-muted-foreground">Carrier: {selectedLocker.network}</p>}
          {selectedLocker.address?.city && (
            <p className="text-muted-foreground">{selectedLocker.address.city} {selectedLocker.address.zip}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stripe Payment Form (inner) ──────────────────────────────────────────
function StripePaymentForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    setError('');
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/admin/gopublica/orders?success=true`,
      },
    });
    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handlePay} disabled={!stripe || processing} className="w-full" size="lg">
        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
        {processing ? 'Processing…' : 'Pay now'}
      </Button>
    </div>
  );
}

// ─── Main Checkout — single page ──────────────────────────────────────────
export default function PlatformCheckout() {
  const router = useRouter();
  const t = useTranslations('admin.gopublicaPage');
  const tenant = useTenant();
  const { items, getSubtotal, clear } = usePlatformCartStore();

  // Form state
  const [buyerType, setBuyerType] = useState<'private' | 'business'>('private');
  const [businessName, setBusinessName] = useState(tenant?.businessName || '');
  const [nip, setNip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash_on_delivery'>('stripe');
  const [deliveryMethod, setDeliveryMethod] = useState<'parcel_locker' | 'courier'>('parcel_locker');
  const [selectedLocker, setSelectedLocker] = useState<ParcelLocker | null>(null);
  const [address, setAddress] = useState({
    name: tenant?.businessName || '',
    phone: tenant?.contact?.phone || '',
    email: '',
    street: tenant?.contact?.address || '',
    city: '',
    zip: '',
  });

  // Order state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const currency = items[0]?.currency || 'PLN';

  const deliveryFee = paymentMethod === 'cash_on_delivery'
    ? 30.00
    : deliveryMethod === 'parcel_locker'
    ? 14.99
    : deliveryMethod === 'courier'
    ? 19.99
    : 0;

  const total = subtotal + deliveryFee;

  // Tenant's Furgonetka config
  const logistics = tenant?.logistics;
  const mapApiKey = logistics?.mapApiKey || '';
  const mapEnv = logistics?.env || 'sandbox';

  // Pre-fill from tenant
  useEffect(() => {
    if (tenant) {
      setAddress((prev) => ({
        ...prev,
        name: prev.name || tenant.businessName || '',
        phone: prev.phone || tenant.contact?.phone || '',
        street: prev.street || tenant.contact?.address || '',
      }));
      setBusinessName((prev) => prev || tenant.businessName || '');
    }
  }, [tenant]);

  const setAddr = (key: string, value: string) =>
    setAddress((prev) => ({ ...prev, [key]: value }));

  const canSubmit = () => {
    if (items.length === 0) return false;
    if (!address.email) return false;
    if (buyerType === 'business' && (!nip || !businessName)) return false;
    if (paymentMethod === 'stripe') {
      if (deliveryMethod === 'parcel_locker' && !selectedLocker) return false;
      if (deliveryMethod === 'courier' && (!address.name || !address.phone || !address.street || !address.city || !address.zip)) return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setSaving(true);
    setError('');

    try {
      const payload: PlatformOrderPayload = {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        buyerType,
        nip: buyerType === 'business' ? nip : undefined,
        businessName: buyerType === 'business' ? businessName : undefined,
        fulfillment: paymentMethod === 'cash_on_delivery'
          ? { type: 'cash_on_delivery' }
          : deliveryMethod === 'parcel_locker'
          ? {
              type: 'parcel_locker',
              parcelLocker: {
                lockerId: selectedLocker!.id,
                network: selectedLocker!.network || 'inpost',
                address: selectedLocker!.address,
              },
            }
          : {
              type: 'courier',
              address: {
                name: address.name,
                phone: address.phone,
                email: address.email,
                street: address.street,
                city: address.city,
                zip: address.zip,
              },
            },
      };

      const result = await createPlatformOrder(payload);

      if (paymentMethod === 'stripe' && result.clientSecret) {
        setClientSecret(result.clientSecret);
      } else {
        clear();
        router.push('/admin/gopublica/orders?success=true');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Empty cart guard
  if (items.length === 0 && !clientSecret) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Your cart is empty</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-3" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Go back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      {/* ─── LEFT: Checkout form (all in one) ─── */}
      <div className="space-y-6">

        {/* ── Buyer Type ── */}
        <Card>
          <CardContent className="p-6">
            <CardTitle className="text-base font-semibold mb-3">Who is buying?</CardTitle>
            <RadioGroup value={buyerType} onValueChange={(v) => setBuyerType(v as any)} className="flex gap-3">
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border cursor-pointer hover:border-primary/40 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 flex-1">
                <RadioGroupItem value="private" />
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Private person</span>
              </label>
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border cursor-pointer hover:border-primary/40 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 flex-1">
                <RadioGroupItem value="business" />
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Business (invoice)</span>
              </label>
            </RadioGroup>
            {buyerType === 'business' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Business name *</Label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">NIP *</Label>
                  <Input value={nip} onChange={(e) => setNip(e.target.value)} placeholder="1234567890" className="mt-1" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Payment Method ── */}
        <Card>
          <CardContent className="p-6">
            <CardTitle className="text-base font-semibold mb-3">Payment method</CardTitle>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="flex gap-3">
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border cursor-pointer hover:border-primary/40 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 flex-1">
                <RadioGroupItem value="stripe" />
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Pay online</p>
                  <p className="text-[10px] text-muted-foreground">Card, BLIK & more</p>
                </div>
              </label>
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border cursor-pointer hover:border-primary/40 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 flex-1">
                <RadioGroupItem value="cash_on_delivery" />
                <Truck className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Cash on delivery</p>
                  <p className="text-[10px] text-muted-foreground">Kraków only · 30 PLN</p>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* ── Delivery Method (Stripe only) ── */}
        {paymentMethod === 'stripe' && (
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-base font-semibold mb-3">Delivery method</CardTitle>
              <RadioGroup value={deliveryMethod} onValueChange={(v) => { setDeliveryMethod(v as any); setSelectedLocker(null); }} className="flex gap-3 mb-4">
                <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border cursor-pointer hover:border-primary/40 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 flex-1">
                  <RadioGroupItem value="parcel_locker" />
                  <Box className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Parcel locker</p>
                    <p className="text-[10px] text-muted-foreground">+14.99 PLN</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border cursor-pointer hover:border-primary/40 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 flex-1">
                  <RadioGroupItem value="courier" />
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Courier</p>
                    <p className="text-[10px] text-muted-foreground">+19.99 PLN</p>
                  </div>
                </label>
              </RadioGroup>

              {deliveryMethod === 'parcel_locker' && (
                <LockerPicker
                  mapApiKey={mapApiKey}
                  mapEnv={mapEnv}
                  onSelect={setSelectedLocker}
                  selectedLocker={selectedLocker}
                />
              )}

              {deliveryMethod === 'courier' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Name *</Label>
                    <Input value={address.name} onChange={(e) => setAddr('name', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Phone *</Label>
                    <Input value={address.phone} onChange={(e) => setAddr('phone', e.target.value)} className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Street *</Label>
                    <Input value={address.street} onChange={(e) => setAddr('street', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">City *</Label>
                    <Input value={address.city} onChange={(e) => setAddr('city', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">ZIP *</Label>
                    <Input value={address.zip} onChange={(e) => setAddr('zip', e.target.value)} className="mt-1" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── COD notice ── */}
        {paymentMethod === 'cash_on_delivery' && (
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-base font-semibold mb-3">Cash on delivery</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your order will be delivered to your business address. Payment of <strong>{total.toFixed(2)} PLN</strong> will be collected upon delivery.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Contact details ── */}
        <Card>
          <CardContent className="p-6">
            <CardTitle className="text-base font-semibold mb-3">Contact details</CardTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Name *</Label>
                <Input value={address.name} onChange={(e) => setAddr('name', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Phone *</Label>
                <Input value={address.phone} onChange={(e) => setAddr('phone', e.target.value)} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={address.email} onChange={(e) => setAddr('email', e.target.value)} className="mt-1" placeholder="your@email.com" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Stripe Payment (inline) ── */}
        {clientSecret && paymentMethod === 'stripe' && (
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-base font-semibold mb-3">Payment</CardTitle>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <StripePaymentForm clientSecret={clientSecret} />
              </Elements>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Submit / Place Order */}
        {!clientSecret && (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || saving}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : paymentMethod === 'stripe' ? (
              <CreditCard className="w-4 h-4 mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Placing order…' : paymentMethod === 'stripe' ? `Pay ${total.toFixed(2)} PLN` : 'Place order'}
          </Button>
        )}

        <Button variant="outline" onClick={() => router.back()} className="w-full" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Marketplace
        </Button>
      </div>

      {/* ─── RIGHT: Order Summary ─── */}
      <div>
        <Card className="sticky top-4">
          <CardContent className="p-6">
            <CardTitle className="text-base font-semibold mb-4">Order Summary</CardTitle>

            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  {item.photo && (
                    <img src={item.photo} alt={item.title} className="w-10 h-10 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.currency} {item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {item.currency} {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{currency} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{currency} {deliveryFee.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{currency} {total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
