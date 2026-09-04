'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTenant } from '@/entities/tenant/TenantContext'
import ChangePasswordForm from '@/widgets/Admin/ChangePasswordForm'

// Импорты UI компонентов shadcn
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const tAuth = useTranslations('auth')
  const tAdmin = useTranslations('admin')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const tenant = useTenant()

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token')
    if (savedToken) {
      setToken(savedToken)
      // Hard navigation to force a full page load — ensures AdminLayout
      // remounts fresh and all data-fetching effects re-run with the new token.
      window.location.href = '/admin/menu'
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          tenantId: tenant?.tenantId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || tAdmin('loginError'))

      localStorage.setItem('saas_token', data.token)
      setToken(data.token)

      if (data.mustChangePassword) {
        setMustChangePassword(true)
      } else {
        // Hard navigation to force a full page load — ensures AdminLayout
        // remounts fresh and all data-fetching effects re-run with the new token.
        window.location.href = '/admin'
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Экран принудительной смены пароля
  if (token && mustChangePassword) {
    return (
      <div className="platform-ui min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <ChangePasswordForm
          token={token}
          onPasswordChanged={() => {
            setMustChangePassword(false)
            window.location.href = '/admin'
          }}
        />
      </div>
    )
  }

  // Основной экран логина
  return (
    <div className="platform-ui min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-sm shadow-md border-border">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {tAuth('welcomeBack')}
          </CardTitle>
          <CardDescription>
            {tAuth('enterCredentials')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Блок с ошибкой */}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="pl-9 bg-background"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Пароль */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {/* Опционально: ссылка на восстановление пароля */}
                {/* <a href="#" className="text-sm font-medium text-primary hover:underline">{tAuth('forgotPassword')}</a> */}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 bg-background"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Кнопка отправки */}
            <Button 
              type="submit" 
              className="w-full mt-2" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tAuth('loggingIn')}
                </>
              ) : (
                tAuth('login')
              )}
            </Button>
            
          </form>
        </CardContent>
      </Card>
    </div>
  )
}