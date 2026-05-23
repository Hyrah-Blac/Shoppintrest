'use client'

import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/useThemeStore'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="btn-icon"
      aria-label="Toggle theme"
    >
      {isDark
        ? <Sun  size={17} />
        : <Moon size={17} />
      }
    </button>
  )
}