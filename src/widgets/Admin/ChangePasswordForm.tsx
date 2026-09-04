'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function ChangePasswordForm({
  token,
  onPasswordChanged,
}: {
  token: string
  onPasswordChanged: () => void
}) {
  const t = useTranslations('admin.changePassword')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('error'))
      setSuccess(t('success'))
      setTimeout(onPasswordChanged, 1500)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-10 bg-card p-6 rounded-lg border border-border shadow-sm">
      <h2 className="text-lg font-bold mb-4 text-foreground">{t('title')}</h2>
      {error && <p className="text-destructive text-sm mb-4">{error}</p>}
      {success && <p className="text-emerald-600 dark:text-emerald-400 text-sm mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder={t('oldPasswordPlaceholder')}
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="w-full border border-input bg-background p-2 rounded text-foreground placeholder:text-muted-foreground"
          required
        />
        <input
          type="password"
          placeholder={t('newPasswordPlaceholder')}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border border-input bg-background p-2 rounded text-foreground placeholder:text-muted-foreground"
          required
        />
        <button
          type="submit"
          className="w-full py-2 rounded text-primary-foreground font-medium"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {t('submit')}
        </button>
      </form>
    </div>
  )
}