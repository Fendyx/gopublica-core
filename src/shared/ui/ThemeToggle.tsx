'use client'
import { useTheme } from '@/shared/ui/ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors"
      aria-label="Переключить тему"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}