'use client'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isAdmin = pathname.startsWith('/admin')
  const isCheckout = pathname.includes('/order/checkout')

  // В чекауте не показываем переключатель (принудительно светлая тема)
  if (isCheckout || !mounted) return null

  // В админке используем admin-light / admin-dark, на публичной части light / dark
  const isDark = isAdmin ? theme === 'admin-dark' : theme === 'dark'
  const nextTheme = isAdmin 
    ? (isDark ? 'admin-light' : 'admin-dark')
    : (isDark ? 'light' : 'dark')

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors"
      aria-label="Переключить тему"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}