'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/entities/tenant/TenantContext'
import ChangePasswordForm from '@/widgets/Admin/ChangePasswordForm'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const router = useRouter()
  const tenant = useTenant()

  useEffect(() => {
    const savedToken = localStorage.getItem('saas_token')
    if (savedToken) {
      setToken(savedToken)
      router.push('/admin/menu')
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
      if (!res.ok) throw new Error(data.error || 'Ошибка входа')

      localStorage.setItem('saas_token', data.token)
      setToken(data.token)

      if (data.mustChangePassword) {
        setMustChangePassword(true)
      } else {
        router.push('/admin')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (token && mustChangePassword) {
    return (
      <div className="platform-ui min-h-screen flex items-center justify-center bg-background">
        <ChangePasswordForm
          token={token}
          onPasswordChanged={() => {
            setMustChangePassword(false)
            router.push('/admin')
          }}
        />
      </div>
    )
  }

  return (
    <div className="platform-ui min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleLogin} className="bg-card p-8 rounded-lg shadow-md w-full max-w-sm border border-border">
        <h1 className="text-xl font-bold mb-6 text-center text-foreground">Вход в управление</h1>
        {error && <p className="text-destructive text-sm mb-4">{error}</p>}
        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-input bg-background rounded mb-4 text-foreground" required
        />
        <input
          type="password" placeholder="Пароль" value={password}
          onChange={e => setPassword(e.target.value)} className="w-full p-2 border border-input bg-background rounded mb-6 text-foreground" required
        />
        <button type="submit" className="w-full py-2 rounded text-primary-foreground font-medium" style={{ backgroundColor: 'var(--color-primary)' }}>
          Войти
        </button>
      </form>
    </div>
  )
}