'use client'
import { useState } from 'react'

export default function ChangePasswordForm({
  token,
  onPasswordChanged,
}: {
  token: string
  onPasswordChanged: () => void
}) {
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
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      setSuccess('Пароль успешно изменён!')
      setTimeout(onPasswordChanged, 1500)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-4">Смена пароля</h2>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder="Старый пароль (временный)"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Новый пароль"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="w-full py-2 rounded text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Сменить пароль
        </button>
      </form>
    </div>
  )
}