'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/store/useThemeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initTheme = useThemeStore((s) => s.initTheme)

  useEffect(() => {
    initTheme()
  }, [initTheme])

  return <>{children}</>
}