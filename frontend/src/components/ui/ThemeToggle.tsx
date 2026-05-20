'use client'

import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/useThemeStore'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeStore()

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 rounded-xl text-muted hover:text-foreground
                 hover:bg-accent transition-all duration-200"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}