'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Mail, Lock, Phone, UserPlus, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';

export default function RegisterPage() {
  const { locale } = useParams();
  const router = useRouter();
  const t = useTranslations('auth');
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tenant = useTenant();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ВАЖНО: Убедись, что этот URL совпадает с роутом на бекенде
        const res = await fetch(`${API_BASE}/api/public/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            tenantId: tenant?.tenantId // <--- Добавляем tenantId
        })
        });

      const data = await res.json();

      if (res.ok) {
        // Если бекенд сразу возвращает токен при регистрации - сохраняем и редиректим
        if (data.token) {
          localStorage.setItem('customer_token', data.token);
          router.push(`/${locale}/profile`);
        } else {
          // Если нужно сначала залогиниться - кидаем на страницу логина
          router.push(`/${locale}/login`);
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Server error. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 text-center">
          <Link href={`/${locale}/menu`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to menu
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('createAccount')}</h1>
          <p className="text-muted-foreground mt-1">{t('joinUs')}</p>
        </div>

        <Card className="shadow-lg border-border/80 rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/80 p-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="w-5 h-5 text-primary" /> {t('register')}
            </CardTitle>
            <CardDescription className="mt-1">{t('fillInDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2 border bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-9 rounded-xl"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-9 rounded-xl"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-muted-foreground">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+48 123 456 789" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-9 rounded-xl"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-9 rounded-xl"
                    required 
                  />
                </div>
                <p className="text-xs text-muted-foreground pt-1">Minimum 8 characters.</p>
              </div>

              <Button type="submit" disabled={loading} className="w-full rounded-xl h-11 text-base shadow-sm mt-2">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('registering')}</> : t('register')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t('haveAccount')} <Link href={`/${locale}/login`} className="text-primary font-medium hover:underline">{t('login')}</Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}