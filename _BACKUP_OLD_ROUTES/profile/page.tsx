'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Добавлен useRouter
import Link from 'next/link'; // Добавлен Link
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Lock, Trash2, Package, LogOut, Mail, Phone, CheckCircle2, AlertCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

type UserProfile = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  consents: any;
};

export default function ProfilePage() {
  const { locale } = useParams();
  const router = useRouter(); // Инициализация роутера
  const t = useTranslations('profile');
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ current: '', new: '' });

  const [updateLoading, setUpdateLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchProfile = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/public/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setFormData({ name: data.name, phone: data.phone });
      } else if (res.status === 401) {
        localStorage.removeItem('customer_token');
        router.push(`/${locale}/menu`); // Используем router.push
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setMessage(null);

    const token = localStorage.getItem('customer_token');
    try {
      const res = await fetch(`${API_BASE}/api/public/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: formData.name, phone: formData.phone })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: t('dataUpdated') });
        fetchProfile(); 
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || t('updateError') });
      }
    } catch (e) {
      setMessage({ type: 'error', text: t('serverError') });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage(null);

    const token = localStorage.getItem('customer_token');
    try {
      const res = await fetch(`${API_BASE}/api/public/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: t('passwordChanged') });
        setPasswordData({ current: '', new: '' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || t('passwordChangeError') });
      }
    } catch (e) {
      setMessage({ type: 'error', text: t('serverError') });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = confirm(t('deleteConfirm'));
    if (!confirmDelete) return;
    
    const confirmWord = prompt(t('deletePrompt'));
    if (confirmWord !== 'DELETE') {
      alert(t('deleteCanceled'));
      return;
    }

    setDeleteLoading(true);
    const token = localStorage.getItem('customer_token');

    try {
      const res = await fetch(`${API_BASE}/api/public/profile`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        localStorage.removeItem('customer_token');
        alert(t('accountDeleted'));
        router.push(`/${locale}/menu`); // Используем router.push
      } else {
        alert(t('deleteError'));
      }
    } catch (e) {
      alert(t('serverError'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    router.push(`/${locale}/menu`); // Используем router.push
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{t('loadingProfile')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center border border-border rounded-2xl bg-card shadow-sm">
        <p className="text-lg font-medium text-foreground mb-2">{t('sessionExpired')}</p>
        <p className="text-muted-foreground mb-6">{t('pleaseLoginAgain')}</p>
        <Button onClick={handleLogout}>{t('login')}</Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto p-4 md:p-8 py-12 space-y-8"
    >
      {/* Шапка профиля */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border">
        <div className="flex items-center gap-5">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary text-2xl font-bold border-4 border-background shadow-sm ring-1 ring-border">
            {getInitials(user.name)}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{user.name || t('defaultName')}</h1>
            <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
              <Mail className="w-4 h-4" /> {user.email}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Используем Link вместо window.location */}
          <Button asChild variant="outline" className="shadow-sm">
            <Link href={`/${locale}/profile/orders`}>
              <Package className="w-4 h-4 mr-2" /> {t('myOrders')}
            </Link>
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
          </Button>
        </div>
      </div>

      {/* Уведомления */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' 
                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Личная информация */}
        <Card className="shadow-sm border-border/80 rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/80 p-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-primary" /> {t('personalData')}
            </CardTitle>
            <CardDescription className="mt-1">{t('updateContactDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground">{t('name')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="name"
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-9 rounded-xl"
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-muted-foreground">{t('phone')}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="phone"
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-9 rounded-xl"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">{t('emailReadOnly')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" value={user.email} disabled className="pl-9 rounded-xl bg-muted/50 cursor-not-allowed" />
                </div>
              </div>
              
              <Button type="submit" disabled={updateLoading} className="w-full rounded-xl h-11 text-base shadow-sm">
                {updateLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('saving')}</> : t('saveChanges')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Безопасность */}
        <Card className="shadow-sm border-border/80 rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/80 p-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lock className="w-5 h-5 text-primary" /> {t('security')}
            </CardTitle>
            <CardDescription className="mt-1">{t('changeLoginPassword')}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="current_pass" className="text-muted-foreground">{t('currentPassword')}</Label>
                <Input 
                  id="current_pass"
                  type="password" 
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_pass" className="text-muted-foreground">{t('newPassword')}</Label>
                <Input 
                  id="new_pass"
                  type="password" 
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="rounded-xl"
                  required
                />
                <p className="text-xs text-muted-foreground pt-1">{t('passwordHint')}</p>
              </div>
              <Button type="submit" disabled={passwordLoading} variant="secondary" className="w-full rounded-xl h-11 text-base shadow-sm border border-border">
                {passwordLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('updating')}</> : t('changePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Опасная зона */}
      <Card className="border-destructive/20 bg-destructive/5 rounded-2xl shadow-none">
        <CardHeader className="p-6">
          <CardTitle className="text-destructive flex items-center gap-2 text-lg">
            <ShieldAlert className="w-5 h-5" /> {t('dangerZone')}
          </CardTitle>
          <CardDescription className="text-destructive/80">
            {t('deleteWarning')}
          </CardDescription>
        </CardHeader>
        <CardFooter className="p-6 pt-0">
          <Button 
            onClick={handleDeleteAccount} 
            disabled={deleteLoading}
            variant="destructive"
            className="rounded-xl shadow-sm hover:bg-destructive/90"
          >
            {deleteLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('deleting')}</> : t('deleteAccount')}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}