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

export function ThemeScript() {
  const script = `
    (function () {
      try {
        var stored = localStorage.getItem('shoppintrest-theme');
        var theme  = stored ? JSON.parse(stored).state?.theme : 'system';
        var dark   =
          theme === 'dark' ||
          (theme !== 'light' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (dark) document.documentElement.classList.add('dark');
      } catch (_) {}
    })();
  `

  // dangerouslySetInnerHTML is intentional and safe here — this is a
  // well-known Next.js pattern for blocking theme scripts.
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
    />
  )
}